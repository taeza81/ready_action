document.addEventListener('DOMContentLoaded', () => {
    // DOM 요소
    const startScreen = document.getElementById('start-screen');
    const gameScreen = document.getElementById('game-screen');
    const startBtn = document.getElementById('start-btn');
    const captureBtn = document.getElementById('capture-btn');
    const nextBtn = document.getElementById('next-btn');
    const homeBtn = document.getElementById('home-btn');
    
    const poseImage = document.getElementById('pose-image');
    const cameraFeed = document.getElementById('camera-feed');
    const snapshotCanvas = document.getElementById('snapshot-canvas');
    const countdownOverlay = document.getElementById('countdown-overlay');
    const countdownText = document.getElementById('countdown-text');
    const fullscreenBtn = document.getElementById('fullscreen-btn');

    // 변수
    let stream = null;
    const poseImages = [
        '동작/img1.jpg',
        '동작/img2.jpg',
        '동작/img3.jpg',
        '동작/img4.jpg',
        '동작/img5.jpg',
        '동작/img6.jpg',
        '동작/img7.jpg',
        '동작/img8.jpg',
        '동작/img9.jpg',
        '동작/img10.jpg',
        '동작/img11.jpg',
        '동작/img12.jpg'
    ];
    let currentPoseIndex = 0;
    
    // 오디오 컨텍스트 설정 (사용자 상호작용 후 초기화)
    let audioCtx;
    
    function initAudio() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    function playBeep(frequency, type, duration, volume = 0.1) {
        if (!audioCtx) return;
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.type = type;
        oscillator.frequency.value = frequency;
        
        gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + duration);
    }

    function playCountdownBeep() {
        playBeep(440, 'sine', 0.5); // 라 음
    }

    function playCaptureSound() {
        // 찰칵 소리 흉내
        playBeep(880, 'square', 0.1, 0.2);
        setTimeout(() => playBeep(440, 'sawtooth', 0.2, 0.2), 50);
    }

    // 카메라 시작
    async function startCamera() {
        try {
            stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    width: { ideal: 1280 }, 
                    height: { ideal: 720 }, 
                    facingMode: "user" 
                },
                audio: false
            });
            cameraFeed.srcObject = stream;
        } catch (err) {
            console.error("카메라 접근 에러:", err);
            alert("카메라 권한을 허용해주세요!");
        }
    }

    // 카메라 정지
    function stopCamera() {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            cameraFeed.srcObject = null;
        }
    }

    // 게임 시작 버튼 클릭
    startBtn.addEventListener('click', () => {
        initAudio();
        startScreen.classList.remove('active');
        gameScreen.classList.add('active');
        startCamera();
        updatePoseImage();
        resetCaptureState();
    });

    // 처음으로 버튼 클릭
    homeBtn.addEventListener('click', () => {
        stopCamera();
        gameScreen.classList.remove('active');
        startScreen.classList.add('active');
    });

    // 동작 이미지 업데이트
    function updatePoseImage() {
        poseImage.src = poseImages[currentPoseIndex];
    }

    // 사진 촬영 (캡처) 버튼 클릭
    captureBtn.addEventListener('click', () => {
        initAudio();
        captureBtn.disabled = true;
        let count = 3; // 3초 카운트다운으로 변경됨
        countdownOverlay.style.display = 'flex';
        
        countdownText.innerText = count;
        playCountdownBeep();

        const timer = setInterval(() => {
            count--;
            if (count > 0) {
                // DOM 렌더링 강제를 위해 애니메이션 재시작
                countdownText.style.animation = 'none';
                countdownText.offsetHeight; /* trigger reflow */
                countdownText.style.animation = null; 
                
                countdownText.innerText = count;
                playCountdownBeep();
            } else {
                clearInterval(timer);
                countdownOverlay.style.display = 'none';
                takeSnapshot();
            }
        }, 1000);
    });

    // 스냅샷 촬영
    function takeSnapshot() {
        playCaptureSound();
        
        // 캔버스 크기를 비디오 원본 크기에 맞춤
        snapshotCanvas.width = cameraFeed.videoWidth;
        snapshotCanvas.height = cameraFeed.videoHeight;
        
        const ctx = snapshotCanvas.getContext('2d');
        // 좌우 반전(거울모드) 보정하여 그리기
        ctx.translate(snapshotCanvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(cameraFeed, 0, 0, snapshotCanvas.width, snapshotCanvas.height);
        
        // UI 변경
        snapshotCanvas.style.display = 'block'; // 정지된 캔버스 표시
        captureBtn.style.display = 'none'; // 촬영 버튼 숨김
        nextBtn.style.display = 'block'; // 다음 버튼 표시
    }

    // 캡처 상태 초기화
    function resetCaptureState() {
        snapshotCanvas.style.display = 'none'; // 캔버스 숨김 (다시 실시간 비디오 보임)
        captureBtn.style.display = 'block';
        captureBtn.disabled = false;
        nextBtn.style.display = 'none';
    }

    // 다음 동작 버튼 클릭
    nextBtn.addEventListener('click', () => {
        currentPoseIndex = (currentPoseIndex + 1) % poseImages.length;
        updatePoseImage();
        resetCaptureState();
    });

    // 전체화면 호환성 함수
    function getFullscreenElement() {
        return document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
    }

    // 전체화면 버튼 클릭
    fullscreenBtn.addEventListener('click', () => {
        const docElm = document.documentElement;
        if (!getFullscreenElement()) {
            if (docElm.requestFullscreen) {
                docElm.requestFullscreen().catch(err => {
                    console.error("전체화면 에러:", err);
                    alert("이 브라우저(또는 기기)에서는 웹페이지 전체화면을 지원하지 않거나 차단되어 있습니다. (예: 아이폰 사파리 등)");
                });
            } else if (docElm.webkitRequestFullscreen) { /* Safari / iOS (iPad) */
                try {
                    docElm.webkitRequestFullscreen();
                } catch(err) {
                    alert("이 브라우저에서는 전체화면을 지원하지 않습니다.");
                }
            } else if (docElm.msRequestFullscreen) { /* IE11 */
                docElm.msRequestFullscreen();
            } else {
                alert("현재 기기나 브라우저에서는 전체화면 기능을 지원하지 않습니다.");
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        }
    });

    // 전체화면 상태 변경 감지하여 버튼 텍스트 변경
    function handleFullscreenChange() {
        if (getFullscreenElement()) {
            fullscreenBtn.innerText = '🪟 창모드';
        } else {
            fullscreenBtn.innerText = '📺 전체화면';
        }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
});
