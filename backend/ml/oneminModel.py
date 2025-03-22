from sklearn.ensemble import IsolationForest
import numpy as np
import joblib

# Example data: time taken to approve/reject requests (in seconds)
times = np.array([60, 120, 180, 240, 300]).reshape(-1, 1)  # 1 minute, 2 minutes, etc.

# Train the model
model = IsolationForest(contamination=0.1)  # 10% of data is considered anomalous
model.fit(times)

# Save the model
joblib.dump(model, "anomaly_detection_model.pkl")
print("✅ Model retrained and saved successfully!")