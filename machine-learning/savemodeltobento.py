"""
This module saves a Keras model to BentoML with resource optimizations.
"""

from pathlib import Path
import os
import tensorflow as tf
import bentoml

# TensorFlow optimizations
os.environ["CUDA_VISIBLE_DEVICES"] = ""  # Disable GPU to avoid CUDA warnings
os.environ["TF_NUM_INTEROP_THREADS"] = "4"  # Limit inter-thread parallelism
os.environ["TF_NUM_INTRAOP_THREADS"] = "4"  # Limit intra-thread parallelism

def load_model_and_save_it_to_bento(model_path: Path, model_name: str) -> None:
    """
    Loads a keras model from disk and saves it to BentoML.

    Args:
        model_path (Path): Path to the model file (.h5 or SavedModel format).
        model_name (str): Name to register the model in BentoML.
    """
    try:
        print(f"Loading model from {model_path}...")
        model = tf.keras.saving.load_model(model_path)
        print(f"Saving model '{model_name}' to BentoML...")
        bento_model = bentoml.keras.save_model(model_name, model)
        print(f"Bento model saved: {bento_model.tag}")
    except Exception as e:
        print(f"Failed to save model '{model_name}' due to error: {e}")


if __name__ == "__main__":
    # Paths to model files
    models = [
        ("service/models/model_p_2_1_best.h5", "p_model"),
        ("service/models/model_s_2_1_best.h5", "s_model"),
        ("service/models/model_mag_1.h5", "mag_model"),
        ("service/models/model_dist_1.h5", "dist_model"),
    ]

    # Process each model
    for model_path, model_name in models:
        load_model_and_save_it_to_bento(Path(model_path), model_name)
