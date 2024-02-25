FROM python:3.8-slim


COPY main.py /app/main.py
COPY data.json /app/data.json

RUN pip install redis

CMD ["python", "/app/main.py"]
