package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	"strings"

	"github.com/confluentinc/confluent-kafka-go/kafka"
	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
	"github.com/joho/godotenv"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/redis/go-redis/v9"
)

type Station struct {
	Code      string    `json:"code"`
	Lat       string    `json:"lat"`
	Long      string    `json:"long"`
	Elevation string    `json:"elevation"`
	Name      string    `json:"name"`
	Channels  []Channel `json:"channels"`
	Enabled   *bool     `json:"enabled,omitempty"`
}

type Channel struct {
	Code       string  `json:"code"`
	Depth      float64 `json:"depth"`
	Azimuth    float64 `json:"azimuth"`
	Dip        float64 `json:"dip"`
	SampleRate float64 `json:"sample_rate"`
}

type responseWriter struct {
	http.ResponseWriter
	statusCode int
}

func NewResponseWriter(w http.ResponseWriter) *responseWriter {
	return &responseWriter{w, http.StatusOK}
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.statusCode = code
	rw.ResponseWriter.WriteHeader(code)
}

var totalRequests = prometheus.NewCounterVec(
	prometheus.CounterOpts{
		Name: "http_requests_total",
		Help: "Number of get requests.",
	},
	[]string{"path"},
)

var responseStatus = prometheus.NewCounterVec(
	prometheus.CounterOpts{
		Name: "response_status",
		Help: "Status of HTTP response",
	},
	[]string{"status"},
)

var httpDuration = promauto.NewHistogramVec(prometheus.HistogramOpts{
	Name: "http_response_time_seconds",
	Help: "Duration of HTTP requests.",
}, []string{"path"})

func prometheusMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		route := mux.CurrentRoute(r)
		path, _ := route.GetPathTemplate()

		timer := prometheus.NewTimer(httpDuration.WithLabelValues(path))
		rw := NewResponseWriter(w)
		next.ServeHTTP(rw, r)

		statusCode := rw.statusCode

		responseStatus.WithLabelValues(strconv.Itoa(statusCode)).Inc()
		totalRequests.WithLabelValues(path).Inc()

		timer.ObserveDuration()
	})
}

var client *redis.Client

func init() {
	// Inisialisasi koneksi ke Redis
	loadEnv()
	redisHost := os.Getenv("REDIS_HOST")
	client = redis.NewClient(&redis.Options{
		Addr: redisHost,
	})
	prometheus.Register(totalRequests)
	prometheus.Register(responseStatus)
	prometheus.Register(httpDuration)
}

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

func loadEnv() {
	if err := godotenv.Load(); err != nil {
		fmt.Printf("Error loading .env file: %s\n", err)
	}
}

func main() {
	loadEnv()
	fmt.Println("Load env finished")

	sigchan := make(chan os.Signal, 1)
	signal.Notify(sigchan, syscall.SIGINT, syscall.SIGTERM)

	// kafkaBrokers := os.Getenv("BOOTSTRAP_SERVERS")
	// topicConsumers := os.Getenv("TOPIC_CONSUMERS")
	port := ":" + os.Getenv("PORT")

	// fmt.Println("Creating Kafka consumer")

	// c, err := kafka.NewConsumer(&kafka.ConfigMap{
	// 	"bootstrap.servers": kafkaBrokers,
	// 	"group.id":          "ws-rest",
	// 	"auto.offset.reset": "earliest",
	// })

	// if err != nil {
	// 	fmt.Printf("Error creating Kafka consumer: %s\n", err)
	// 	return
	// }

	// kafkaTopics := strings.Split(topicConsumers, ",")

	// defer c.Close()
	// fmt.Println("Subscribing Kafka topic")

	// if err := c.SubscribeTopics(kafkaTopics, nil); err != nil {
	// 	fmt.Printf("Error subscribing to topic: %s\n", err)
	// 	return
	// }

	r := mux.NewRouter()
	apiRouter := r.PathPrefix("/api").Subrouter()
	apiRouter.Use(prometheusMiddleware)
	r.Use(accessControlMiddleware)

	apiRouter.HandleFunc("/live", GetLive).Methods("GET")
	apiRouter.HandleFunc("/stop", PostIdle).Methods("POST")
	apiRouter.HandleFunc("/playback", GetPlayback).Methods("GET")
	apiRouter.HandleFunc("/stations", GetStationsHandler).Methods("GET")
	apiRouter.HandleFunc("/stations/toggle", ToggleStationHandler).Methods("POST", "OPTIONS")
	r.Path("/prometheus").Handler(promhttp.Handler())

	r.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		// WebsocketHandler(w, r, c, sigchan)
		WebsocketHandler(w, r, sigchan)
	})
	// r.HandleFunc("/mock/ws", func(w http.ResponseWriter, r *http.Request) {
	// 	MockWebsocketHandler(w, r, c, sigchan)
	// })

	http.Handle("/", r)
	fmt.Println("ListenAndServe")
	// err = http.ListenAndServe(port, nil)
	err := http.ListenAndServe(port, nil)
	fmt.Println("ListenAndServe finished successfully")

	if err != nil {
		fmt.Println(err)
	}
}

func WebsocketHandler(w http.ResponseWriter, r *http.Request, sigchan chan os.Signal) {
	upgrader.CheckOrigin = func(r *http.Request) bool { return true }
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		fmt.Printf("Error while upgrading connection: %s\n", err)
		return
	}
	defer conn.Close()

	kafkaBrokers := os.Getenv("BOOTSTRAP_SERVERS")
	topicConsumers := os.Getenv("TOPIC_CONSUMERS")

	fmt.Println("Creating Kafka consumer")

	c, err := kafka.NewConsumer(&kafka.ConfigMap{
		"bootstrap.servers": kafkaBrokers,
		"group.id":          "ws-rest",
		"auto.offset.reset": "latest",
	})

	if err != nil {
		fmt.Printf("Error creating Kafka consumer: %s\n", err)
		return
	}

	kafkaTopics := strings.Split(topicConsumers, ",")

	defer c.Close()
	fmt.Println("Subscribing Kafka topic")

	if err := c.SubscribeTopics(kafkaTopics, nil); err != nil {
		fmt.Printf("Error subscribing to topic: %s\n", err)
		return
	}

	ticker := time.NewTicker(1 * time.Second)
	defer ticker.Stop()

	var messages []map[string]interface{}

	for {
		select {
		case <-ticker.C:
			if len(messages) > 0 {
				fmt.Println(len(messages))
				jsonData, err := json.Marshal(messages)
				if err != nil {
					fmt.Printf("Error encoding message: %s\n", err)
					continue
				}

				if err := conn.WriteMessage(websocket.TextMessage, jsonData); err != nil {
					fmt.Printf("Error sending Kafka message over WebSocket: %s\n", err)
					return
				}

				messages = nil // Clear the message buffer after sending

			}

		case sig := <-sigchan:
			fmt.Printf("Caught signal %v: terminating\n", sig)
			return

		default:
			ev := c.Poll(100)
			if ev == nil {
				continue
			}

			switch e := ev.(type) {
			case *kafka.Message:
				message := make(map[string]interface{})
				message["topic"] = e.TopicPartition.Topic
				message["value"] = string(e.Value)
				messages = append(messages, message)

			case kafka.Error:
				fmt.Printf("Error while consuming: %v\n", e)
			}
		}
	}
}

// func WebsocketHandler(w http.ResponseWriter, r *http.Request, c *kafka.Consumer, sigchan chan os.Signal) {
// 	upgrader.CheckOrigin = func(r *http.Request) bool { return true }
// 	conn, err := upgrader.Upgrade(w, r, nil)
// 	if err != nil {
// 		fmt.Printf("Error while upgrading connection: %s\n", err)
// 		return
// 	}
// 	defer conn.Close()

// 	ticker := time.NewTicker(1 * time.Second)
// 	defer ticker.Stop()

// 	var messages []map[string]interface{}

// 	for {
// 		select {
// 		case <-ticker.C:
// 			if len(messages) > 0 {
// 				fmt.Println(len(messages))
// 				jsonData, err := json.Marshal(messages)
// 				if err != nil {
// 					fmt.Printf("Error encoding message: %s\n", err)
// 					continue
// 				}

// 				if err := conn.WriteMessage(websocket.TextMessage, jsonData); err != nil {
// 					fmt.Printf("Error sending Kafka message over WebSocket: %s\n", err)
// 					return
// 				}

// 				messages = nil // Clear the message buffer after sending

// 			}

// 		case sig := <-sigchan:
// 			fmt.Printf("Caught signal %v: terminating\n", sig)
// 			return

// 		default:
// 			ev := c.Poll(100)
// 			if ev == nil {
// 				continue
// 			}

// 			switch e := ev.(type) {
// 			case *kafka.Message:
// 				message := make(map[string]interface{})
// 				message["topic"] = e.TopicPartition.Topic
// 				message["value"] = string(e.Value)
// 				messages = append(messages, message)

// 			case kafka.Error:
// 				fmt.Printf("Error while consuming: %v\n", e)
// 			}
// 		}
// 	}
// }

func GetLive(w http.ResponseWriter, _ *http.Request) {
	producerSvc := "http://" + os.Getenv("PRODUCER_SERVICE") + "/live"
	resp, err := http.Get(producerSvc)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()
	fmt.Println((producerSvc))

	// Process the response if needed and send it to the client
	// Example: Forward the response from the external service
	_, err = io.Copy(w, resp.Body)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func PostIdle(w http.ResponseWriter, _ *http.Request) {
	producerSvc := "http://" + os.Getenv("PRODUCER_SERVICE") + "/idle"
	resp, err := http.Post(producerSvc, "application/json", bytes.NewBuffer([]byte("{}")))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()
	fmt.Println((producerSvc))

	// Process the response if needed and send it to the client
	// Example: Forward the response from the external service
	_, err = io.Copy(w, resp.Body)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func GetPlayback(w http.ResponseWriter, r *http.Request) {
	producerSvc := "http://" + os.Getenv("PRODUCER_SERVICE") + "/playback"

	// Extract query parameters "starttime" and "endtime" from the request
	starttime := r.FormValue("start_time")
	endtime := r.FormValue("end_time")
	// Implement logic to make a GET request to another external service with the provided query parameters
	// For example, make a GET request to localhost:3001/playback?starttime=xxx&endtime=yyy
	// Use the "net/http" package to make the external request

	playbackURL := fmt.Sprintf("%s?start_time=%s&end_time=%s", producerSvc, starttime, endtime)
	resp, err := http.Get(playbackURL)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()
	fmt.Println(playbackURL)

	// Process the response if needed and send it to the client
	// Example: Forward the response from the external service
	_, err = io.Copy(w, resp.Body)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func GetStationsHandler(w http.ResponseWriter, _ *http.Request) {
	fmt.Println("GetStationsHandler")
	ctx := context.Background()

	// Mendapatkan data stasiun dari Redis
	stationsJSON, err := client.Get(ctx, "STATIONS").Result()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Mendapatkan daftar station codes yang diaktifkan
	enabledCodesJSON, err := client.Get(ctx, "ENABLED_STATION_CODES").Result()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	enabledCodes := strings.Split(enabledCodesJSON, ",")

	var stations []Station
	err = json.Unmarshal([]byte(stationsJSON), &stations)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Menambahkan properti "enabled" ke setiap stasiun
	for i := range stations {
		enabled := new(bool)
		*enabled = contains(enabledCodes, stations[i].Code)
		stations[i].Enabled = enabled
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(stations)
}

func ToggleStationHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Println("ToggleStationHandler")
	ctx := context.Background()
	fmt.Println("ToggleStationHandler2")

	var input struct {
		Code string `json:"code"`
	}

	err := json.NewDecoder(r.Body).Decode(&input)
	if err != nil {
		fmt.Println("ToggleStationHandler3rror")
		fmt.Println(err.Error())
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	fmt.Println("ToggleStationHandler3")

	enabledCodesJSON, err := client.Get(ctx, "ENABLED_STATION_CODES").Result()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	enabledCodes := strings.Split(enabledCodesJSON, ",")

	// Cek apakah station code sudah ada di ENABLED_STATION_CODES
	if contains(enabledCodes, input.Code) {
		// Hapus station code
		updatedCodes := remove(enabledCodes, input.Code)
		updatedCodesJSON := strings.Join(updatedCodes, ",")
		client.Set(ctx, "ENABLED_STATION_CODES", updatedCodesJSON, 0)
	} else {
		// Tambahkan station code
		updatedCodes := append(enabledCodes, input.Code)
		updatedCodesJSON := strings.Join(updatedCodes, ",")
		client.Set(ctx, "ENABLED_STATION_CODES", updatedCodesJSON, 0)
	}

	w.WriteHeader(http.StatusOK)
}

func contains(arr []string, code string) bool {
	for _, item := range arr {
		if item == code {
			return true
		}
	}
	return false
}

func remove(arr []string, code string) []string {
	var updatedArr []string
	for _, item := range arr {
		if item != code {
			updatedArr = append(updatedArr, item)
		}
	}
	return updatedArr
}

// access control and  CORS middleware
func accessControlMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS,PUT")
		w.Header().Set("Access-Control-Allow-Headers", "Origin, Content-Type")

		if r.Method == "OPTIONS" {
			return
		}

		next.ServeHTTP(w, r)
	})
}
