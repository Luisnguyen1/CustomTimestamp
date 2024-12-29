let cameraPermissionGranted = false;
let locationPermissionGranted = false;

async function requestCameraPermission() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
        cameraPermissionGranted = true;
        document.getElementById('cameraBtn').classList.add('granted');
        document.getElementById('cameraBtn').textContent = 'Đã cho phép Camera';
        checkAllPermissions();
    } catch (err) {
        console.error('Lỗi khi yêu cầu quyền camera:', err);
        alert('Không thể truy cập camera. Vui lòng kiểm tra lại quyền truy cập.');
    }
}

async function requestLocationPermission() {
    try {
        await navigator.geolocation.getCurrentPosition(() => {
            locationPermissionGranted = true;
            document.getElementById('locationBtn').classList.add('granted');
            document.getElementById('locationBtn').textContent = 'Đã cho phép Vị trí';
            checkAllPermissions();
        });
    } catch (err) {
        console.error('Lỗi khi yêu cầu quyền vị trí:', err);
        alert('Không thể truy cập vị trí. Vui lòng kiểm tra lại quyền truy cập.');
    }
}

function checkAllPermissions() {
    if (cameraPermissionGranted && locationPermissionGranted) {
        // Gửi thông tin quyền truy cập lên server
        fetch('/request_permissions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                camera: cameraPermissionGranted,
                location: locationPermissionGranted
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                document.getElementById('permissions-modal').style.display = 'none';
            }
        });
    }
}

function updateTimeFormat() {
    const select = document.getElementById('timeFormat');
    const format = select.value;
    
    fetch(`/update_format/${format}`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                console.log('Định dạng thời gian đã được cập nhật');
            }
        })
        .catch(error => console.error('Lỗi:', error));
}

document.addEventListener('DOMContentLoaded', function() {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const captureButton = document.getElementById('captureButton');
    const downloadModal = document.getElementById('downloadModal');
    const downloadBtn = document.getElementById('downloadBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    let currentImageBlob = null;

    // Thêm các biến mới
    const editTimestampBtn = document.getElementById('editTimestampBtn');
    const editTimestampModal = document.getElementById('editTimestampModal');
    const customTimestampInput = document.getElementById('customTimestamp');
    const saveTimestampBtn = document.getElementById('saveTimestampBtn');
    const cancelTimestampBtn = document.getElementById('cancelTimestampBtn');
    let useCustomTimestamp = false;
    let customTimestampText = '';

    // Thêm các biến cho chỉnh sửa location
    const editLocationBtn = document.getElementById('editLocationBtn');
    const editLocationModal = document.getElementById('editLocationModal');
    const customLocationInput = document.getElementById('customLocation');
    const saveLocationBtn = document.getElementById('saveLocationBtn');
    const cancelLocationBtn = document.getElementById('cancelLocationBtn');
    let useCustomLocation = false;
    let customLocationText = '';

    const switchCameraBtn = document.getElementById('switchCameraBtn');
    let currentFacingMode = 'environment';

    // Hàm khởi tạo camera với facing mode cụ thể
    async function initCamera(facingMode = 'environment') {
        try {
            if (video.srcObject) {
                video.srcObject.getTracks().forEach(track => track.stop());
            }

            const constraints = {
                video: {
                    facingMode: facingMode,
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                }
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            video.srcObject = stream;
            await video.play();
            currentFacingMode = facingMode;
        } catch (err) {
            console.error("Lỗi khi khởi tạo camera:", err);
            alert("Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập.");
        }
    }

    // Xử lý nút đổi camera
    switchCameraBtn.addEventListener('click', () => {
        const newFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment';
        initCamera(newFacingMode);
    });

    // Khởi tạo camera ban đầu
    initCamera();

    // Xử lý nút chụp ảnh
    captureButton.addEventListener('click', async function() {
        // Hiệu ứng khi nhấn nút
        this.style.transform = 'scale(0.95)';
        setTimeout(() => this.style.transform = 'scale(1)', 100);

        // Chụp ảnh
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        
        // Vẽ video lên canvas
        ctx.drawImage(video, 0, 0);
        
        // Lấy nội dung timestamp và location
        const timestamp = document.getElementById('timestamp').textContent;
        const location = document.getElementById('location').textContent;
        
        // Thiết lập style cho text
        ctx.fillStyle = 'white';
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 2;
        ctx.lineWidth = 1;

        // Tính toán kích thước font và vị trí
        const fontSizeTimestamp = Math.floor(canvas.height * 0.07); // Tăng kích thước font timestamp
        const fontSizeLocation = Math.floor(canvas.height * 0.05); // Tăng kích thước font location

        // Vẽ timestamp
        ctx.font = `bold ${fontSizeTimestamp}px Arial`;
        const timestampY = canvas.height - (canvas.height * 0.15); // Đặt timestamp cao hơn một chút
        ctx.fillText(timestamp, canvas.width * 0.05, timestampY);

        // Vẽ địa chỉ
        ctx.font = `${fontSizeLocation}px Arial`;
        const addressY = timestampY + fontSizeLocation * 1.2;
        
        // Tách và vẽ từng phần của địa chỉ
        const addressParts = location.split(',').map(part => part.trim());
        const streetAddress = addressParts[0];
        const district = addressParts[1];
        const city = addressParts[2];

        // Vẽ địa chỉ với khoảng cách và căn chỉnh phù hợp
        ctx.fillText(streetAddress, canvas.width * 0.05, addressY);
        ctx.fillText(district, canvas.width * 0.05, addressY + fontSizeLocation * 1.2);
        ctx.fillText(city, canvas.width * 0.05, addressY + fontSizeLocation * 2.4);

        // Chuyển canvas thành blob với chất lượng cao
        canvas.toBlob((blob) => {
            currentImageBlob = blob;
            showModal('downloadModal');
        }, 'image/jpeg', 1.0);
    });

    // Xử lý nút tải về
    downloadBtn.addEventListener('click', () => {
        if (currentImageBlob) {
            const url = URL.createObjectURL(currentImageBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `capture_${new Date().getTime()}.jpg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            hideModal('downloadModal');
        }
    });

    // Xử lý nút hủy
    cancelBtn.addEventListener('click', () => {
        hideModal('downloadModal');
    });

    // Xử lý nút edit timestamp
    editTimestampBtn.addEventListener('click', () => {
        customTimestampInput.value = customTimestampText || document.getElementById('timestamp').textContent;
        showModal('editTimestampModal');
    });

    // Xử lý nút lưu timestamp
    saveTimestampBtn.addEventListener('click', () => {
        customTimestampText = customTimestampInput.value.trim();
        useCustomTimestamp = customTimestampText !== '';
        if (useCustomTimestamp) {
            document.getElementById('timestamp').textContent = customTimestampText;
        }
        hideModal('editTimestampModal');
    });

    // Xử lý nút hủy chỉnh sửa timestamp
    cancelTimestampBtn.addEventListener('click', () => {
        hideModal('editTimestampModal');
    });

    // Xử lý nút edit location
    editLocationBtn.addEventListener('click', () => {
        customLocationInput.value = customLocationText || document.getElementById('location').textContent;
        showModal('editLocationModal');
    });

    // Xử lý nút lưu location
    saveLocationBtn.addEventListener('click', () => {
        customLocationText = customLocationInput.value.trim();
        useCustomLocation = customLocationText !== '';
        if (useCustomLocation) {
            document.getElementById('location').textContent = customLocationText;
        }
        hideModal('editLocationModal');
    });

    // Xử lý nút hủy chỉnh sửa location
    cancelLocationBtn.addEventListener('click', () => {
        hideModal('editLocationModal');
    });

    // Sửa lại hàm updateInfo để xử lý cả location tùy chỉnh
    function updateInfo() {
        const timestampElement = document.getElementById('timestamp');
        const locationElement = document.getElementById('location');
        
        // Chỉ cập nhật timestamp nếu không dùng timestamp tùy chỉnh
        if (!useCustomTimestamp) {
            const now = new Date();
            const timeStr = now.toLocaleString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            timestampElement.textContent = timeStr;
        }

        // Chỉ cập nhật location nếu không dùng location tùy chỉnh
        if (!useCustomLocation) {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(position => {
                    locationElement.textContent = "245 Đường Lũy Bán Bích, Tân Phú, Hồ Chí Minh";
                });
            }
        }
    }

    setInterval(updateInfo, 1000);
    updateInfo();

    // Thay đổi cách hiển thị modal
    function showModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.add('show');
    }

    function hideModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.remove('show');
    }
}); 