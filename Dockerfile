# Sử dụng image Python chính thức
FROM python:3.8-slim

# Cài đặt các dependencies cần thiết cho OpenCV
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Tạo và set working directory
WORKDIR /app

# Copy requirements và cài đặt dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy toàn bộ code vào container
COPY . .

# Tạo thư mục để lưu ảnh chụp
RUN mkdir -p static/captures

# Expose port 5000
EXPOSE 5000

# Set environment variables
ENV FLASK_APP=app.py
ENV FLASK_ENV=development

# Command để chạy ứng dụng
CMD ["python", "app.py"] 