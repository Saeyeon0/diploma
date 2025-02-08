# from flask import Flask, request, jsonify, send_file
# from flask_cors import CORS
# import cv2
# import numpy as np
# from sklearn.cluster import KMeans
# from PIL import Image, ImageDraw
# import os

# app = Flask(__name__)
# CORS(app)  # Enable CORS for React frontend

# UPLOAD_FOLDER = "uploads"
# OUTPUT_FOLDER = "output"
# os.makedirs(UPLOAD_FOLDER, exist_ok=True)
# os.makedirs(OUTPUT_FOLDER, exist_ok=True)

# def generate_paint_by_number(image_path, num_colors=10):
#     img = cv2.imread(image_path)
#     if img is None:
#         return None

#     img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
#     pixels = img_rgb.reshape(-1, 3)

#     # Color quantization using KMeans
#     kmeans = KMeans(n_clusters=num_colors, random_state=42).fit(pixels)
#     labels = kmeans.labels_
#     colors = kmeans.cluster_centers_

#     quantized_img = colors[labels].reshape(img_rgb.shape).astype(np.uint8)
#     quantized_pil = Image.fromarray(quantized_img)

#     # Save the segmented image
#     output_path = os.path.join(OUTPUT_FOLDER, "segmented_image.png")
#     quantized_pil.save(output_path)
#     return output_path

# @app.route("/process-image", methods=["POST"])
# def process_image():
#     if "file" not in request.files:
#         return jsonify({"error": "No file uploaded"}), 400

#     file = request.files["file"]
#     file_path = os.path.join(UPLOAD_FOLDER, file.filename)
#     file.save(file_path)

#     segmented_path = generate_paint_by_number(file_path)
#     if segmented_path:
#         return send_file(segmented_path, mimetype="image/png")
#     else:
#         return jsonify({"error": "Failed to process image"}), 500

# if __name__ == "__main__":
#     app.run(debug=True)
