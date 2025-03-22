from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np

app = Flask(__name__)
CORS(app)  # Enable CORS

# Load the trained ML model
model = joblib.load("anomaly_detection_model.pkl")

@app.route("/detect-anomaly", methods=["POST"])
def detect_anomaly():
    print("Detect anomaly endpoint hit!")
    data = request.json
    print("Received data:", data)
    times = np.array(data["times"]).reshape(-1, 1)
    predictions = model.predict(times)
    scores = model.decision_function(times)
    return jsonify({
        "predictions": predictions.tolist(),
        "scores": scores.tolist(),
    })

if __name__ == "__main__":
    app.run(debug=True, port=5001)  # Run on port 5001