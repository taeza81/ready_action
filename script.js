document.addEventListener('DOMContentLoaded', () => {
    // ==========================================================
    // 카카오톡 및 인앱 브라우저 탈출 핸들러 (Safari / Chrome 연결)
    // ==========================================================
    function handleInAppBrowser() {
        const ua = (navigator.userAgent || navigator.vendor || window.opera || '').toLowerCase();
        const urlParams = new URLSearchParams(window.location.search);
        const testParam = urlParams.get('inapp'); // '1', 'true', 'ios', 'android', 'kakao' 등으로 브라우저 탈출 UI 테스트 가능

        const isKakao = ua.includes('kakaotalk') || testParam === 'kakao';
        const isLine = ua.includes('line');
        const isNaver = ua.includes('naver') || ua.includes('naversearchapp');
        const isInstagram = ua.includes('instagram');
        const isFacebook = ua.includes('fbav') || ua.includes('fban');
        const isOtherInApp = ua.includes('daumapps') || ua.includes('kakaostory') || ua.includes('micromessenger');
        
        let isIOS = /iphone|ipad|ipod/.test(ua);
        let isAndroid = /android/.test(ua);

        if (testParam === 'ios') {
            isIOS = true;
            isAndroid = false;
        } else if (testParam === 'android') {
            isAndroid = true;
            isIOS = false;
        }

        const isInApp = isKakao || isLine || isNaver || isInstagram || isFacebook || isOtherInApp || Boolean(testParam);

        const overlay = document.getElementById('inapp-browser-warning');
        if (!overlay) return;

        if (!isInApp) {
            overlay.style.display = 'none';
            return;
        }

        // 인앱 브라우저 화면 가득 채워서 표시
        overlay.style.display = 'flex';

        const targetText = document.getElementById('inapp-target-text');
        const openBtn = document.getElementById('inapp-open-btn');
        const openText = document.getElementById('inapp-open-text');
        const copyBtn = document.getElementById('inapp-copy-btn');
        const dismissBtn = document.getElementById('inapp-dismiss-btn');
        const currentUrlInput = document.getElementById('inapp-current-url');
        const copyToast = document.getElementById('inapp-copy-toast');
        const guideSteps = document.getElementById('inapp-guide-steps');

        const currentUrl = window.location.href;
        if (currentUrlInput) {
            currentUrlInput.value = currentUrl;
        }

        // OS 맞춤 안내 텍스트 설정
        if (isIOS) {
            if (targetText) targetText.innerHTML = '🍎 <strong>Safari(사파리)</strong> 브라우저로 자동 연결 권장';
            if (openText) openText.textContent = 'Safari 브라우저로 바로 열기';
            if (guideSteps) {
                guideSteps.innerHTML = `
                    <div class="guide-step">
                        <span class="step-num">1</span>
                        <span>위 <strong>'Safari 브라우저로 바로 열기'</strong> 버튼 터치</span>
                    </div>
                    <div class="guide-step">
                        <span class="step-num">2</span>
                        <span>화면이 전환되지 않으면 카카오톡 오른쪽 아래 <strong>[ ··· ] 더보기</strong> 또는 <strong>[공유]</strong> 터치</span>
                    </div>
                    <div class="guide-step">
                        <span class="step-num">3</span>
                        <span>메뉴 목록에서 <strong>'Safari로 열기'</strong>를 선택해주세요.</span>
                    </div>
                `;
            }
        } else if (isAndroid) {
            if (targetText) targetText.innerHTML = '🤖 <strong>Chrome(크롬)</strong> 브라우저로 자동 연결 권장';
            if (openText) openText.textContent = 'Chrome 브라우저로 바로 열기';
            if (guideSteps) {
                guideSteps.innerHTML = `
                    <div class="guide-step">
                        <span class="step-num">1</span>
                        <span>위 <strong>'Chrome 브라우저로 바로 열기'</strong> 버튼 터치</span>
                    </div>
                    <div class="guide-step">
                        <span class="step-num">2</span>
                        <span>화면이 전환되지 않으면 카카오톡 오른쪽 위 <strong>[ ⋮ ] 더보기</strong> 메뉴 터치</span>
                    </div>
                    <div class="guide-step">
                        <span class="step-num">3</span>
                        <span>메뉴 목록에서 <strong>'다른 브라우저로 열기'</strong> 또는 <strong>'Chrome으로 열기'</strong>를 선택해주세요.</span>
                    </div>
                `;
            }
        }

        function triggerEscapeScheme() {
            if (isIOS) {
                // iOS 카카오톡 인앱 브라우저 -> 사파리 호출 커스텀 스킴
                const kakaoSafariScheme = `kakaotalk://web/openExternal?url=${encodeURIComponent(currentUrl)}`;
                window.location.href = kakaoSafariScheme;
            } else if (isAndroid) {
                // 안드로이드 크롬 인텐트 호출
                const cleanUrl = currentUrl.replace(/^https?:\/\//i, '');
                const protocol = window.location.protocol.replace(':', '');
                const chromeIntent = `intent://${cleanUrl}#Intent;scheme=${protocol};package=com.android.chrome;end`;
                window.location.href = chromeIntent;
            } else {
                window.open(currentUrl, '_blank');
            }
        }

        // 실제 인앱 브라우저일 경우 자동 탈출 시도 (단, URL 파라미터 테스트일 때는 강제 리다이렉트 방지)
        if (isKakao && !testParam) {
            try {
                triggerEscapeScheme();
            } catch (e) {
                console.warn("외부 브라우저 자동 호출 차단됨:", e);
            }
        }

        if (openBtn) {
            openBtn.addEventListener('click', () => {
                triggerEscapeScheme();
            });
        }

        if (copyBtn) {
            copyBtn.addEventListener('click', async () => {
                try {
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        await navigator.clipboard.writeText(currentUrl);
                    } else if (currentUrlInput) {
                        currentUrlInput.select();
                        document.execCommand('copy');
                    }
                    if (copyToast) {
                        copyToast.classList.add('show');
                        setTimeout(() => copyToast.classList.remove('show'), 2500);
                    }
                } catch (err) {
                    prompt("아래 링크를 복사하여 Safari 또는 Chrome 주소창에 붙여넣어 주세요:", currentUrl);
                }
            });
        }

        if (dismissBtn) {
            dismissBtn.addEventListener('click', () => {
                overlay.style.display = 'none';
            });
        }
    }

    handleInAppBrowser();

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
    const zoomControls = document.getElementById('zoom-controls');
    const zoomInBtn = document.getElementById('zoom-in-btn');
    const zoomOutBtn = document.getElementById('zoom-out-btn');
    const zoomLevelText = document.getElementById('zoom-level-text');

    // 변수
    let stream = null;
    let videoTrack = null;
    let isHardwareZoom = false;
    let currentZoom = 1.0;
    let minZoom = 1.0;
    let maxZoom = 3.0;
    let zoomStep = 0.2;
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
        try {
            if (!audioCtx) {
                const AudioContextClass = window.AudioContext || window.webkitAudioContext;
                if (AudioContextClass) {
                    audioCtx = new AudioContextClass();
                }
            }
            if (audioCtx && audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
        } catch (e) {
            console.warn("AudioContext 초기화 안내:", e);
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

    // 줌 배율 적용 함수 (하이브리드: 하드웨어 줌 or 디지털 줌 Fallback)
    async function applyZoom(newZoom) {
        newZoom = Math.round(newZoom * 10) / 10;
        newZoom = Math.max(minZoom, Math.min(newZoom, maxZoom));
        currentZoom = newZoom;

        // UI 텍스트 갱신
        if (zoomLevelText) {
            zoomLevelText.innerText = `${currentZoom.toFixed(1)}x`;
        }

        // 1) 안드로이드 등 하드웨어 줌 지원 기기
        if (isHardwareZoom && videoTrack) {
            try {
                await videoTrack.applyConstraints({
                    advanced: [{ zoom: currentZoom }]
                });
                cameraFeed.style.transform = 'scaleX(-1)';
            } catch (err) {
                console.warn("하드웨어 줌 적용 실패, 디지털 줌으로 전환:", err);
                isHardwareZoom = false;
                cameraFeed.style.transform = `scaleX(-1) scale(${currentZoom})`;
            }
        } else {
            // 2) 아이폰/아이패드 사파리 및 미지원 기기 (디지털 줌 Fallback)
            cameraFeed.style.transform = `scaleX(-1) scale(${currentZoom})`;
        }
    }

    // 카메라 시작
    async function startCamera() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            alert("현재 브라우저 환경에서는 카메라를 실행할 수 없습니다.\n보안을 위해 HTTPS 환경이나 로컬 환경(localhost)에서 접속해주세요.");
            return;
        }

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
            // iOS Safari 및 모바일 브라우저에서 인라인 비디오 재생 트리거
            await cameraFeed.play().catch(e => console.log("비디오 재생 대기:", e));

            // 카메라 줌 지원 여부(하드웨어 지원) 확인
            videoTrack = stream.getVideoTracks()[0];
            if (videoTrack && typeof videoTrack.getCapabilities === 'function') {
                const capabilities = videoTrack.getCapabilities();
                if (capabilities.zoom) {
                    isHardwareZoom = true;
                    minZoom = capabilities.zoom.min || 1.0;
                    maxZoom = Math.min(capabilities.zoom.max || 3.0, 5.0);
                    zoomStep = capabilities.zoom.step || 0.2;
                } else {
                    isHardwareZoom = false;
                    minZoom = 1.0;
                    maxZoom = 3.0;
                    zoomStep = 0.2;
                }
            } else {
                isHardwareZoom = false;
                minZoom = 1.0;
                maxZoom = 3.0;
                zoomStep = 0.2;
            }

            // 시작 시 1.0x 줌으로 리셋
            applyZoom(1.0);
        } catch (err) {
            console.error("카메라 접근 에러:", err);
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                alert("카메라 권한이 필요합니다. 브라우저 설정에서 카메라 사용을 허용해주세요!");
            } else {
                alert("카메라를 실행할 수 없습니다. 다른 앱에서 카메라를 사용 중인지 확인해주세요.");
            }
        }
    }

    // 카메라 정지
    function stopCamera() {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            cameraFeed.srcObject = null;
            stream = null;
            videoTrack = null;
        }
        applyZoom(1.0);
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
        
        // 캔버스 크기를 비디오 원본 크기에 맞춤 (기기별 해상도 대응)
        const vWidth = cameraFeed.videoWidth || 1280;
        const vHeight = cameraFeed.videoHeight || 720;
        
        snapshotCanvas.width = vWidth;
        snapshotCanvas.height = vHeight;
        
        const ctx = snapshotCanvas.getContext('2d');
        ctx.save();
        // 좌우 반전(거울모드) 보정하여 그리기
        ctx.translate(vWidth, 0);
        ctx.scale(-1, 1);

        // 디지털 줌(Fallback) 적용 시 사용자가 보던 확대 영역을 중앙 크롭하여 캔버스에 렌더링
        if (!isHardwareZoom && currentZoom > 1.0) {
            const cropW = vWidth / currentZoom;
            const cropH = vHeight / currentZoom;
            const sx = (vWidth - cropW) / 2;
            const sy = (vHeight - cropH) / 2;
            ctx.drawImage(cameraFeed, sx, sy, cropW, cropH, 0, 0, vWidth, vHeight);
        } else {
            ctx.drawImage(cameraFeed, 0, 0, vWidth, vHeight);
        }

        ctx.restore();
        
        // UI 변경
        snapshotCanvas.style.display = 'block'; // 정지된 캔버스 표시
        if (zoomControls) zoomControls.style.display = 'none'; // 촬영 완료 시 줌 컨트롤러 숨김
        captureBtn.style.display = 'none'; // 촬영 버튼 숨김
        nextBtn.style.display = 'block'; // 다음 버튼 표시
    }

    // 캡처 상태 초기화
    function resetCaptureState() {
        snapshotCanvas.style.display = 'none'; // 캔버스 숨김 (다시 실시간 비디오 보임)
        if (zoomControls) zoomControls.style.display = 'flex'; // 줌 컨트롤러 복원
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

    // 줌 조절 버튼 클릭 이벤트
    if (zoomInBtn) {
        zoomInBtn.addEventListener('click', () => {
            applyZoom(currentZoom + zoomStep);
        });
    }

    if (zoomOutBtn) {
        zoomOutBtn.addEventListener('click', () => {
            applyZoom(currentZoom - zoomStep);
        });
    }

    if (zoomLevelText) {
        zoomLevelText.addEventListener('click', () => {
            applyZoom(1.0); // 1.0x 리셋
        });
    }

    // 모바일/태블릿 화면 터치 핀치 줌(Pinch to Zoom) 제스처 지원
    let initialPinchDist = null;
    let initialPinchZoom = 1.0;
    const rightPanelEl = document.querySelector('.right-panel');

    if (rightPanelEl) {
        rightPanelEl.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                initialPinchDist = Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY
                );
                initialPinchZoom = currentZoom;
            }
        }, { passive: true });

        rightPanelEl.addEventListener('touchmove', (e) => {
            if (e.touches.length === 2 && initialPinchDist) {
                const curDist = Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY
                );
                const factor = curDist / initialPinchDist;
                applyZoom(initialPinchZoom * factor);
            }
        }, { passive: true });

        rightPanelEl.addEventListener('touchend', (e) => {
            if (e.touches.length < 2) {
                initialPinchDist = null;
            }
        }, { passive: true });
    }

    // 전체화면 호환성 함수
    function getFullscreenElement() {
        return document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
    }

    // 전체화면 버튼 클릭
    fullscreenBtn.addEventListener('click', () => {
        const docElm = document.documentElement;
        const iosTip = "현재 브라우저/기기(아이폰/아이패드 사파리 등)는 웹페이지 전체화면 API를 지원하지 않습니다.\n\n💡 팁: 사파리 주소창 좌측의 '가/A' 버튼을 눌러 '도구 막대 가리기'를 선택하시거나, 브라우저 공유 메뉴에서 '홈 화면에 추가'하시면 전체화면 앱처럼 사용하실 수 있습니다!";

        if (!getFullscreenElement()) {
            if (docElm.requestFullscreen) {
                docElm.requestFullscreen().catch(err => {
                    console.error("전체화면 에러:", err);
                    alert(iosTip);
                });
            } else if (docElm.webkitRequestFullscreen) { /* Safari / iOS (iPad) */
                try {
                    docElm.webkitRequestFullscreen();
                } catch(err) {
                    alert(iosTip);
                }
            } else if (docElm.msRequestFullscreen) { /* IE11 */
                docElm.msRequestFullscreen();
            } else {
                alert(iosTip);
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
