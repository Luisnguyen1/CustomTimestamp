from flask import Flask, render_template, Response, jsonify, request
import cv2
from datetime import datetime
import time
import json
import os

app = Flask(__name__)

# Khởi tạo camera
camera = cv2.VideoCapture(0)

# Biến toàn cục để lưu định dạng thời gian
time_format = "%Y-%m-%d %H:%M:%S"
time_color = (255, 255, 255)  # Màu trắng
time_position = (50, 50)      # Vị trí mặc định

def generate_frames():
    while True:
        success, frame = camera.read()
        if not success:
            break
        else:
            # Thêm timestamp vào frame
            timestamp = datetime.now().strftime(time_format)
            cv2.putText(frame, timestamp, time_position, 
                       cv2.FONT_HERSHEY_SIMPLEX, 1, time_color, 2)
            
            # Chuyển frame thành bytes để stream
            ret, buffer = cv2.imencode('.jpg', frame)
            frame = buffer.tobytes()
            
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(), 
                   mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/update_format/<new_format>')
def update_format(new_format):
    global time_format
    time_format = new_format
    return jsonify({"status": "success"})

@app.route('/request_permissions', methods=['POST'])
def request_permissions():
    data = request.get_json()
    permissions = {
        'camera': data.get('camera', False),
        'location': data.get('location', False)
    }
    return jsonify({"status": "success", "permissions": permissions})

@app.route('/capture', methods=['POST'])
def capture():
    try:
        image_file = request.files['image']
        if image_file:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"capture_{timestamp}.jpg"
            
            # Tạo thư mục captures nếu chưa tồn tại
            captures_dir = os.path.join(app.static_folder, 'captures')
            if not os.path.exists(captures_dir):
                os.makedirs(captures_dir)
            
            filepath = os.path.join(captures_dir, filename)
            image_file.save(filepath)
            
            return jsonify({
                "status": "success",
                "filename": filename
            })
    except Exception as e:
        print("Lỗi khi lưu ảnh:", str(e))
        return jsonify({"status": "error", "message": str(e)})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=7860)