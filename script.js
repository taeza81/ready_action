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
                        <span>카카오톡에서는 카메라/전체화면이 차단되므로 <strong>'Safari 브라우저로 바로 열기'</strong>를 터치합니다.</span>
                    </div>
                    <div class="guide-step">
                        <span class="step-num">2</span>
                        <span>화면이 전환되지 않으면 카카오톡 우측 하단 <strong>[ ··· ] 더보기</strong> 또는 <strong>[공유 아이콘]</strong> 터치</span>
                    </div>
                    <div class="guide-step">
                        <span class="step-num">3</span>
                        <span>메뉴 목록에서 <strong>'Safari로 열기'</strong>를 선택해주세요. (사파리 접속 후 [홈 화면에 추가] 시 100% 전체화면 앱 지원)</span>
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

    // 신규 교사 설정 및 카메라 편의 기능 DOM 요소
    const ghostOverlay = document.getElementById('ghost-overlay');
    const ghostCanvas = document.getElementById('ghost-canvas');
    const skeletonCanvas = document.getElementById('skeleton-canvas');
    const aiPoseHud = document.getElementById('ai-pose-hud');
    const hudBarCircle = document.getElementById('hud-bar-circle');
    const hudScoreText = document.getElementById('hud-score-text');
    const hudStatusBadge = document.getElementById('hud-status-badge');
    const ghostSubControls = document.getElementById('ghost-sub-controls');
    const guideModeChips = document.querySelectorAll('.guide-mode-chip');
    const guideOpacityChips = document.querySelectorAll('.guide-opacity-chip');
    const teacherSettingsBtn = document.getElementById('teacher-settings-btn');
    const camCornerSettingsBtn = document.getElementById('cam-corner-settings-btn');
    const teacherSettingsPopover = document.getElementById('teacher-settings-popover');
    const closeSettingsBtn = document.getElementById('close-settings-btn');
    const toggleGhostBtn = document.getElementById('toggle-ghost-btn');
    const ghostStatusText = document.getElementById('ghost-status-text');
    const toggleAiPoseBtn = document.getElementById('toggle-ai-pose-btn');
    const aiPoseStatusText = document.getElementById('ai-pose-status-text');
    const aiPoseSubControls = document.getElementById('ai-pose-sub-controls');
    const toggleSkeletonBtn = document.getElementById('toggle-skeleton-btn');
    const aiAutoCaptureChips = document.querySelectorAll('.ai-auto-capture-chip');
    const toggleMirrorBtn = document.getElementById('toggle-mirror-btn');
    const mirrorStatusText = document.getElementById('mirror-status-text');
    const countdownRingProgress = document.getElementById('countdown-ring-progress');
    const timerChips = document.querySelectorAll('.timer-chip');

    // 변수
    let stream = null;
    let videoTrack = null;
    let isHardwareZoom = false;
    let currentZoom = 1.0;
    let minZoom = 1.0;
    let maxZoom = 3.0;
    let zoomStep = 0.2;
    let isGhostActive = false;
    let isAIPoseActive = false;
    let isSkeletonVisible = true;
    let isAutoCaptureEnabled = false;
    let poseTracker = null;
    let isPoseModelReady = false;
    let isProcessingPoseFrame = false;
    let poseFrameAnimId = null;
    let perfectScoreHoldFrames = 0;
    let isCountingDown = false;
    const hudCircumference = 188.5; // 2 * PI * 30
    let isMirrorMode = true;
    let selectedTimer = 5;
    const ringCircumference = 440;
    const poseImages = [
        '동작/img_1.jpg', '동작/img_2.jpg', '동작/img_3.jpg', '동작/img_4.jpg', '동작/img_5.jpg',
        '동작/img_6.jpg', '동작/img_7.jpg', '동작/img_8.jpg', '동작/img_9.jpg', '동작/img_10.jpg',
        '동작/img_11.jpg', '동작/img_12.jpg', '동작/img_13.jpg', '동작/img_14.jpg', '동작/img_15.jpg',
        '동작/img_16.jpg', '동작/img_17.jpg', '동작/img_18.jpg', '동작/img_19.jpg', '동작/img_20.jpg',
        '동작/img_21.jpg', '동작/img_22.jpg', '동작/img_23.jpg', '동작/img_24.jpg', '동작/img_25.jpg',
        '동작/img_26.jpg', '동작/img_27.jpg', '동작/img_28.jpg', '동작/img_29.jpg', '동작/img_30.jpg',
        '동작/img_31.jpg', '동작/img_32.jpg', '동작/img_33.jpg', '동작/img_34.jpg', '동작/img_35.jpg',
        '동작/img_36.jpg', '동작/img_37.jpg', '동작/img_38.jpg'
    ];
    let currentPoseIndex = 0;
    let shuffledIndices = [];
    let shufflePointer = 0;

    // 비복원 무작위 셔플 (Fisher-Yates 알고리즘)
    // 38개 동작을 중복 없이 모두 골고루 무작위 제시 후, 다 돌면 새로 재셔플
    function shufflePoses() {
        shuffledIndices = poseImages.map((_, i) => i);
        for (let i = shuffledIndices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledIndices[i], shuffledIndices[j]] = [shuffledIndices[j], shuffledIndices[i]];
        }
        shufflePointer = 0;
    }

    function pickNextRandomPose() {
        if (shuffledIndices.length === 0 || shufflePointer >= shuffledIndices.length) {
            const lastPose = currentPoseIndex;
            shufflePoses();
            // 재셔플 시 첫 동작이 직전 동작과 같으면 다른 것과 스왑하여 연속 중복 방지
            if (shuffledIndices.length > 1 && shuffledIndices[0] === lastPose) {
                const swapIdx = Math.floor(Math.random() * (shuffledIndices.length - 1)) + 1;
                [shuffledIndices[0], shuffledIndices[swapIdx]] = [shuffledIndices[swapIdx], shuffledIndices[0]];
            }
        }
        currentPoseIndex = shuffledIndices[shufflePointer++];
        updatePoseImage();
    }
    
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

    // 영어 음성 및 다이내믹 효과음
    const countWords = { 5: "Five!", 4: "Four!", 3: "Three!", 2: "Two!", 1: "One!" };
    const countColors = {
        5: '#38bdf8', // 하늘색
        4: '#4ade80', // 초록색
        3: '#facc15', // 노란색
        2: '#fb923c', // 주황색
        1: '#f43f5e'  // 핑크레드
    };

    function speakCountdown(num) {
        if ('speechSynthesis' in window) {
            try {
                window.speechSynthesis.cancel(); // 이전 발화 중단
                const utter = new SpeechSynthesisUtterance(countWords[num] || String(num));
                utter.lang = 'en-US';
                // 카운트다운이 1에 가까워질수록 음높이(pitch)를 높여 신나는 긴장감 조성
                utter.pitch = 1.05 + (5 - num) * 0.12;
                utter.rate = 1.15;
                window.speechSynthesis.speak(utter);
            } catch (e) {
                console.warn("음성 카운트다운 지원 안 됨:", e);
            }
        }
    }

    function playCountdownFx(num) {
        if (!audioCtx) return;
        // 밝고 통통 튀는 아케이드 차임벨 사운드 (도-레-미-솔-높은도)
        const notes = { 5: 523.25, 4: 587.33, 3: 659.25, 2: 783.99, 1: 1046.50 };
        const freq = notes[num] || 523.25;

        const osc = audioCtx.createOscillator();
        const oscHarmonic = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.2, audioCtx.currentTime + 0.15);

        oscHarmonic.type = 'sine';
        oscHarmonic.frequency.setValueAtTime(freq * 2, audioCtx.currentTime);

        gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);

        osc.connect(gainNode);
        oscHarmonic.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        osc.start();
        oscHarmonic.start();
        osc.stop(audioCtx.currentTime + 0.35);
        oscHarmonic.stop(audioCtx.currentTime + 0.35);
    }

    // 스마트폰 카메라 셔터음 (찰칵-! 기계식 듀얼 스냅 사운드)
    function playSmartphoneShutter() {
        if (!audioCtx) return;
        try {
            const sampleRate = audioCtx.sampleRate;
            const duration = 0.22;
            const bufferSize = Math.floor(sampleRate * duration);
            const buffer = audioCtx.createBuffer(1, bufferSize, sampleRate);
            const data = buffer.getChannelData(0);

            // 1단계: 셔터 열림(t: 0~0.025s) + 2단계: 셔터 닫힘 기계음(t: 0.065~0.18s)
            for (let i = 0; i < bufferSize; i++) {
                const t = i / sampleRate;
                let sample = 0;

                // 셔터 기계 클릭 1
                if (t >= 0 && t < 0.025) {
                    const env = Math.exp(-t * 280);
                    sample += (Math.random() * 2 - 1) * 0.9 * env;
                }

                // 셔터 찰칵 스냅 2 (65ms 뒤)
                if (t >= 0.065 && t < 0.18) {
                    const dt = t - 0.065;
                    const env = Math.exp(-dt * 65);
                    const noise = (Math.random() * 2 - 1) * 0.75;
                    const bodyTone = Math.sin(2 * Math.PI * 1600 * dt) * 0.35;
                    sample += (noise + bodyTone) * env;
                }

                data[i] = sample;
            }

            const source = audioCtx.createBufferSource();
            source.buffer = buffer;

            const bandpass = audioCtx.createBiquadFilter();
            bandpass.type = 'bandpass';
            bandpass.frequency.value = 2400;
            bandpass.Q.value = 1.2;

            const highpass = audioCtx.createBiquadFilter();
            highpass.type = 'highpass';
            highpass.frequency.value = 800;

            const gain = audioCtx.createGain();
            gain.gain.setValueAtTime(0.85, audioCtx.currentTime);

            source.connect(highpass);
            highpass.connect(bandpass);
            bandpass.connect(gain);
            gain.connect(audioCtx.destination);

            source.start();
        } catch (e) {
            console.warn("셔터음 재생 오류:", e);
        }
    }

    // 카메라 플래시 시각 효과
    function triggerCameraFlash() {
        const flashEl = document.getElementById('camera-flash');
        if (flashEl) {
            flashEl.classList.add('flash');
            setTimeout(() => {
                flashEl.classList.remove('flash');
            }, 120);
        }
    }

    // 줌 배율 적용 함수 (하이브리드: 하드웨어 줌 or 디지털 줌 Fallback + 거울 모드 지원)
    async function applyZoom(newZoom) {
        newZoom = Math.round(newZoom * 10) / 10;
        newZoom = Math.max(minZoom, Math.min(newZoom, maxZoom));
        currentZoom = newZoom;

        // UI 텍스트 갱신
        if (zoomLevelText) {
            zoomLevelText.innerText = `${currentZoom.toFixed(1)}x`;
        }

        const flip = isMirrorMode ? -1 : 1;

        // 1) 안드로이드 등 하드웨어 줌 지원 기기
        if (isHardwareZoom && videoTrack) {
            try {
                await videoTrack.applyConstraints({
                    advanced: [{ zoom: currentZoom }]
                });
                cameraFeed.style.transform = `scaleX(${flip})`;
            } catch (err) {
                console.warn("하드웨어 줌 적용 실패, 디지털 줌으로 전환:", err);
                isHardwareZoom = false;
                cameraFeed.style.transform = `scaleX(${flip}) scale(${currentZoom})`;
            }
        } else {
            // 2) 아이폰/아이패드 사파리 및 미지원 기기 (디지털 줌 Fallback)
            cameraFeed.style.transform = `scaleX(${flip}) scale(${currentZoom})`;
        }

        // 스켈레톤 캔버스도 카메라 변형(거울 모드, 줌)과 100% 동일하게 일치 동기화
        if (skeletonCanvas) {
            skeletonCanvas.style.transform = cameraFeed.style.transform;
        }
    }

    // 카메라 시작
    // 카메라 시작 (기존 세션 스트림 재사용으로 권한 반복 요청 방지 및 전체화면 유지)
    async function startCamera() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            alert("현재 브라우저 환경에서는 카메라를 실행할 수 없습니다.\n보안을 위해 HTTPS 환경이나 로컬 환경(localhost)에서 접속해주세요.");
            return false;
        }

        // 1) 이미 세션 중에 한 번 권한을 받아 생성된 스트림이 있는 경우:
        // 브라우저 권한 팝업 없이 0.01초 만에 즉시 비디오 재생 복원!
        if (stream && videoTrack && videoTrack.readyState === 'live') {
            videoTrack.enabled = true;
            if (cameraFeed.srcObject !== stream) {
                cameraFeed.srcObject = stream;
            }
            try {
                await cameraFeed.play();
            } catch (e) {
                console.log("비디오 재생 대기:", e);
            }
            applyZoom(currentZoom || 1.0);
            return true;
        }

        // 2) 최초 1회 또는 스트림이 없을 때만 신규 getUserMedia 호출
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
            return true;
        } catch (err) {
            console.error("카메라 접근 에러:", err);
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                alert("카메라 권한이 필요합니다. 브라우저 설정에서 카메라 사용을 허용해주세요!");
            } else {
                alert("카메라를 실행할 수 없습니다. 다른 앱에서 카메라를 사용 중인지 확인해주세요.");
            }
            return false;
        }
    }

    // 카메라 일시정지 ('처음으로' 이동 시 스트림 권한은 유지하고 센서 캡처만 일시 대기)
    function pauseCamera() {
        if (cameraFeed) {
            cameraFeed.pause();
        }
        if (videoTrack) {
            videoTrack.enabled = false;
        }
        applyZoom(1.0);
    }

    // 카메라 정지 (permanent가 true일 때만 브라우저 권한 스트림 완전 해제)
    function stopCamera(permanent = false) {
        if (permanent) {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
                stream = null;
                videoTrack = null;
            }
            if (cameraFeed) cameraFeed.srcObject = null;
            applyZoom(1.0);
        } else {
            pauseCamera();
        }
    }

    // 게임 시작 버튼 클릭
    startBtn.addEventListener('click', async () => {
        initAudio();
        
        // 사용자가 전체화면 모드였는지 상태 저장
        const wasInFullscreen = !!getFullscreenElement();

        startScreen.classList.remove('active');
        gameScreen.classList.add('active');
        if (homeBtn) homeBtn.style.display = 'inline-flex';

        await startCamera();

        // 브라우저의 권한 팝업 보안 정책으로 인해 전체화면이 임시 해제되었던 경우, 원래 전체화면으로 즉시 자동 복원
        if (wasInFullscreen && !getFullscreenElement()) {
            try {
                const docElm = document.documentElement;
                if (docElm.requestFullscreen) {
                    await docElm.requestFullscreen();
                } else if (docElm.webkitRequestFullscreen) {
                    docElm.webkitRequestFullscreen();
                } else if (docElm.msRequestFullscreen) {
                    docElm.msRequestFullscreen();
                }
            } catch (fsErr) {
                console.log("전체화면 자동 복원 시도:", fsErr);
            }
        }

        shufflePoses();
        pickNextRandomPose();
        resetCaptureState();

        // AI 관절 인식이 켜져 있는 상태라면 트래킹 루프 재가동
        if (isAIPoseActive) {
            initMediaPipePose();
            if (!poseFrameAnimId) {
                poseTrackingLoop();
            }
        }
    });

    // 처음으로 버튼 클릭
    homeBtn.addEventListener('click', () => {
        // 스트림을 영구 파괴(stop)하지 않고 일시정지(pause)하여, 세션 동안 카메라 권한 허용 팝업이 반복해서 뜨지 않도록 방지
        pauseCamera();
        // AI 트래킹 프레임 루프 일시 정지 및 스켈레톤 캔버스 정리
        if (poseFrameAnimId) {
            cancelAnimationFrame(poseFrameAnimId);
            poseFrameAnimId = null;
        }
        if (skeletonCanvas) {
            const ctx = skeletonCanvas.getContext('2d');
            ctx.clearRect(0, 0, skeletonCanvas.width, skeletonCanvas.height);
        }
        gameScreen.classList.remove('active');
        startScreen.classList.add('active');
        if (homeBtn) homeBtn.style.display = 'none';
        toggleTeacherSettings(false);
    });

    // ==========================================================
    // 스마트 포즈 실루엣 가이드 엔진 (투명 PNG 기반 무결점 AR 가이드)
    // - 🌟 네온 외곽선: 인물의 가장 바깥 실루엣 테두리만 네온 시안으로 선명 발광
    //   -> 신체 내부(머리/옷) 및 배경 100% 완전 투명! 학생 카메라 모습 100% 무가림 투과!
    //   -> 창모드/전체화면에서 네모 테두리 바 전혀 없음!
    // - 👻 투명 고스트: JPEG 흰색 배경만 100% 제거된 순수 캐릭터 반투명 오버레이
    // - 👤 네온 실루엣: 배경 100% 투명 + 사이버 블루 실루엣 틴트
    // ==========================================================
    let ghostGuideMode = 'outline'; // 'outline' | 'ghost' | 'silhouette'
    let ghostGuideOpacity = 0.8;    // 0.4 | 0.8 | 1.0

    function applyGhostStyles(el, mode, opacity) {
        if (!el) return;
        el.classList.remove('mode-outline', 'mode-ghost', 'mode-silhouette');
        el.classList.add(`mode-${mode}`);
        
        if (mode === 'ghost') {
            el.style.opacity = (opacity * 0.75).toFixed(2);
        } else if (mode === 'silhouette') {
            el.style.opacity = (opacity * 0.85).toFixed(2);
        } else {
            el.style.opacity = opacity;
        }
    }

    function updateGhostGuide() {
        if (!isGhostActive) return;
        const poseNum = currentPoseIndex + 1;

        let targetSrc = `동작/outline_${poseNum}.png`;
        if (ghostGuideMode === 'ghost' || ghostGuideMode === 'silhouette') {
            targetSrc = `동작/ghost_${poseNum}.png`;
        }

        if (ghostOverlay) {
            ghostOverlay.onerror = () => {
                ghostOverlay.onerror = null;
                // 미생성 이미지 번호일 경우 원본 JPG로 부드럽게 Fallback
                ghostOverlay.src = `동작/img_${poseNum}.jpg`;
            };
            ghostOverlay.src = targetSrc;
            applyGhostStyles(ghostOverlay, ghostGuideMode, ghostGuideOpacity);
            ghostOverlay.style.display = 'block';
        }

        if (ghostCanvas) {
            ghostCanvas.style.display = 'none';
        }
    }

    // 동작 이미지 업데이트
    function updatePoseImage() {
        poseImage.src = poseImages[currentPoseIndex];
        if (isGhostActive) {
            updateGhostGuide();
        }
    }

    // ==========================================================
    // Google MediaPipe Pose 기반 AI 관절 인식 & 실시간 일치율 분석 엔진
    // ==========================================================
    const POSE_CONNECTIONS = [
        [11, 12], // 어깨
        [11, 13], [13, 15], // 왼팔 (어깨-팔꿈치-손목)
        [12, 14], [14, 16], // 오른팔 (어깨-팔꿈치-손목)
        [11, 23], [12, 24], // 상체 측면
        [23, 24], // 골반
        [23, 25], [25, 27], // 왼다리 (골반-무릎-발목)
        [24, 26], [26, 28]  // 오른다리 (골반-무릎-발목)
    ];

    function initMediaPipePose() {
        if (poseTracker || typeof window.Pose === 'undefined') return;
        try {
            poseTracker = new window.Pose({
                locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
            });
            poseTracker.setOptions({
                modelComplexity: 1,
                smoothLandmarks: true,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5
            });
            poseTracker.onResults(onPoseResults);
            isPoseModelReady = true;
            console.log("MediaPipe Pose 엔진 초기화 성공");
        } catch (e) {
            console.warn("MediaPipe Pose 초기화 중 예외:", e);
        }
    }

    let lastPoseProcessTime = 0;
    async function poseTrackingLoop() {
        if (!isAIPoseActive) return;

        const now = performance.now();
        // 부드러운 25~30 FPS 속도로 카메라 프레임 전송 및 분석
        if (cameraFeed && cameraFeed.readyState >= 2 && poseTracker && !isProcessingPoseFrame && (now - lastPoseProcessTime >= 35)) {
            isProcessingPoseFrame = true;
            lastPoseProcessTime = now;
            try {
                await poseTracker.send({ image: cameraFeed });
            } catch (err) {
                // 프레임 전송 오류 방어
            } finally {
                isProcessingPoseFrame = false;
            }
        }

        if (isAIPoseActive) {
            poseFrameAnimId = requestAnimationFrame(poseTrackingLoop);
        }
    }

    function drawSkeleton(landmarks, w, h) {
        if (!skeletonCanvas) return;
        const ctx = skeletonCanvas.getContext('2d');
        if (skeletonCanvas.width !== w || skeletonCanvas.height !== h) {
            skeletonCanvas.width = w;
            skeletonCanvas.height = h;
        }
        ctx.clearRect(0, 0, w, h);

        if (!isSkeletonVisible || !landmarks) return;

        function getPt(idx) {
            const lm = landmarks[idx];
            if (!lm) return null;
            return { x: lm.x * w, y: lm.y * h, v: lm.visibility || 1 };
        }

        // 1) 뼈대 라인 그리기 (네온 시안 발광)
        ctx.lineWidth = 4.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowColor = '#00f5ff';
        ctx.shadowBlur = 12;
        ctx.strokeStyle = '#00f5ff';

        POSE_CONNECTIONS.forEach(([startIdx, endIdx]) => {
            const p1 = getPt(startIdx);
            const p2 = getPt(endIdx);
            if (p1 && p2 && p1.v > 0.4 && p2.v > 0.4) {
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
            }
        });

        // 2) 관절 포인트 그리기 (빛나는 화이트/네온 시안 원)
        const keyJoints = [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];
        keyJoints.forEach(idx => {
            const pt = getPt(idx);
            if (pt && pt.v > 0.4) {
                ctx.beginPath();
                ctx.arc(pt.x, pt.y, 6.5, 0, Math.PI * 2);
                ctx.fillStyle = '#ffffff';
                ctx.shadowColor = '#ffffff';
                ctx.shadowBlur = 8;
                ctx.fill();
                ctx.strokeStyle = '#00f5ff';
                ctx.lineWidth = 2.5;
                ctx.stroke();
            }
        });
    }

    function calculateJointAngle(a, b, c) {
        const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
        let angle = Math.abs((radians * 180.0) / Math.PI);
        if (angle > 180.0) angle = 360.0 - angle;
        return angle;
    }

    function evaluatePoseAccuracy(lm, poseIdx) {
        if (!lm || lm.length < 29) return 0;

        const nose = lm[0];
        const lShoulder = lm[11], rShoulder = lm[12];
        const lElbow = lm[13], rElbow = lm[14];
        const lWrist = lm[15], rWrist = lm[16];
        const lHip = lm[23], rHip = lm[24];
        const lKnee = lm[25], rKnee = lm[26];
        const lAnkle = lm[27], rAnkle = lm[28];

        if (lShoulder.visibility < 0.35 || rShoulder.visibility < 0.35) {
            return 30; // 몸의 일부만 포착됨
        }

        const lArmAngle = calculateJointAngle(lShoulder, lElbow, lWrist);
        const rArmAngle = calculateJointAngle(rShoulder, rElbow, rWrist);

        let score = 55;
        const poseNum = poseIdx + 1;

        if (poseNum === 1 || poseNum === 27 || poseNum === 30 || poseNum === 35) {
            // 1, 27, 30, 35번: 머리 위 하트 / 기지개 / 합장
            const bothHandsUp = lWrist.y < lShoulder.y && rWrist.y < rShoulder.y;
            const handsOverHead = lWrist.y < nose.y && rWrist.y < nose.y;
            const handsClose = Math.abs(lWrist.x - rWrist.x) < 0.32;

            if (handsOverHead && handsClose) score = 94;
            else if (bothHandsUp) score = 82;
            else score = 68;
        } else if (poseNum === 2 || poseNum === 18 || poseNum === 19) {
            // 2, 18, 19번: 화이팅 만세 / 승리 응원 / 별 점프
            const bothHandsUp = lWrist.y < nose.y && rWrist.y < nose.y;
            const handsWide = Math.abs(lWrist.x - rWrist.x) > 0.28;
            if (bothHandsUp && handsWide) score = 93;
            else if (bothHandsUp) score = 79;
        } else if (poseNum === 3 || poseNum === 4 || poseNum === 31 || poseNum === 32) {
            // 3, 4, 31, 32번: 비행기 / 별 모양 / 저울 균형 / 전사 자세 (양팔 수평)
            const armsSpread = Math.abs(lWrist.x - rWrist.x) > 0.52;
            const armsHorizontal = Math.abs(lWrist.y - lShoulder.y) < 0.25 && Math.abs(rWrist.y - rShoulder.y) < 0.25;
            if (armsSpread && armsHorizontal) score = 93;
            else if (armsSpread) score = 78;
        } else if (poseNum === 7 || poseNum === 14 || poseNum === 22 || poseNum === 33) {
            // 7, 14, 22, 33번: 스쿼트 / 크라우칭 / 기마자세 (무릎 굽힘)
            const lLegAngle = calculateJointAngle(lHip, lKnee, lAnkle);
            const rLegAngle = calculateJointAngle(rHip, rKnee, rAnkle);
            if (lLegAngle < 145 || rLegAngle < 145) score = 92;
            else score = 68;
        } else if (poseNum === 8 || poseNum === 24 || poseNum === 34) {
            // 8, 24, 34번: 알통 자랑 / 율동 체조 (팔꿈치 90도 굽힘)
            const elbowsBent = Math.abs(lArmAngle - 90) < 38 || Math.abs(rArmAngle - 90) < 38;
            if (elbowsBent) score = 92;
            else score = 70;
        } else if (poseNum === 9 || poseNum === 29) {
            // 9, 29번: 양손 허리 당당한 자세
            const handsNearHips = Math.abs(lWrist.y - lHip.y) < 0.18 && Math.abs(rWrist.y - rHip.y) < 0.18;
            if (handsNearHips) score = 93;
            else score = 70;
        } else if (poseNum === 17 || poseNum === 25 || poseNum === 37 || poseNum === 38) {
            // 17, 25, 37, 38번: 한 손 하늘 높이 들기 / 측면 스트레칭 / 승리 만세 펀치
            const oneHandHigh = (lWrist.y < nose.y && rWrist.y > lShoulder.y) || (rWrist.y < nose.y && lWrist.y > rShoulder.y);
            if (oneHandHigh) score = 94;
            else score = 72;
        } else if (poseNum === 11 || poseNum === 13 || poseNum === 23 || poseNum === 28 || poseNum === 36) {
            // 11, 13, 23, 28, 36번: 한 발 들기 균형 / 축구 킥 / 옆차기 / 댄서 밸런스
            const oneFootLifted = Math.abs(lAnkle.y - rAnkle.y) > 0.08 || Math.abs(lKnee.y - rKnee.y) > 0.08;
            if (oneFootLifted) score = 93;
            else score = 74;
        } else if (poseNum === 10 || poseNum === 16 || poseNum === 26) {
            // 10, 16, 26번: 어깨 / 손목 크로스 스트레칭
            const handsTogether = Math.abs(lWrist.x - rWrist.x) < 0.25 && Math.abs(lWrist.y - rWrist.y) < 0.22;
            if (handsTogether) score = 92;
            else score = 75;
        } else {
            const lActive = lArmAngle < 150;
            const rActive = rArmAngle < 150;
            score = 68 + (lActive ? 12 : 0) + (rActive ? 13 : 0);
        }

        return Math.min(100, Math.max(30, Math.round(score + (Math.random() * 4 - 2))));
    }

    function updateAIHUD(score) {
        if (!aiPoseHud) return;

        if (hudBarCircle) {
            const offset = hudCircumference - (hudCircumference * (score / 100));
            hudBarCircle.style.strokeDashoffset = offset;
            if (score >= 85) {
                hudBarCircle.style.stroke = '#facc15';
            } else if (score >= 70) {
                hudBarCircle.style.stroke = '#4ade80';
            } else {
                hudBarCircle.style.stroke = '#00f5ff';
            }
        }

        if (hudScoreText) {
            hudScoreText.innerText = `${score}%`;
        }

        if (hudStatusBadge) {
            if (score >= 85) {
                hudStatusBadge.innerText = 'PERFECT! 완벽해요! 🔥';
                hudStatusBadge.className = 'hud-status-badge perfect';
            } else if (score >= 70) {
                hudStatusBadge.innerText = '아주 좋아요! 유지해봐요 👍';
                hudStatusBadge.className = 'hud-status-badge';
            } else if (score >= 50) {
                hudStatusBadge.innerText = '자세를 더 크게 해봐요! 💪';
                hudStatusBadge.className = 'hud-status-badge';
            } else {
                hudStatusBadge.innerText = '동작을 따라해 보세요! ✨';
                hudStatusBadge.className = 'hud-status-badge';
            }
        }

        // 자동 촬영 트리거 (85% 이상 유지 시 자동 카운트다운/촬영)
        if (isAutoCaptureEnabled && score >= 85 && !isCountingDown) {
            perfectScoreHoldFrames++;
            if (perfectScoreHoldFrames >= 20) {
                perfectScoreHoldFrames = 0;
                captureBtn.click();
            }
        } else {
            perfectScoreHoldFrames = Math.max(0, perfectScoreHoldFrames - 1);
        }
    }

    function onPoseResults(results) {
        if (!isAIPoseActive) return;

        const w = cameraFeed.videoWidth || 1280;
        const h = cameraFeed.videoHeight || 720;

        if (!results.poseLandmarks) {
            if (skeletonCanvas) {
                const ctx = skeletonCanvas.getContext('2d');
                ctx.clearRect(0, 0, skeletonCanvas.width, skeletonCanvas.height);
            }
            updateAIHUD(0);
            return;
        }

        drawSkeleton(results.poseLandmarks, w, h);
        const score = evaluatePoseAccuracy(results.poseLandmarks, currentPoseIndex);
        updateAIHUD(score);
    }

    // 1) 교사 설정 팝오버 열기/닫기 토글 함수
    function toggleTeacherSettings(forceState) {
        if (!teacherSettingsPopover) return;
        const isCurrentlyOpen = teacherSettingsPopover.style.display === 'block';
        const targetState = forceState !== undefined ? forceState : !isCurrentlyOpen;

        if (targetState) {
            teacherSettingsPopover.style.display = 'block';
            if (teacherSettingsBtn) teacherSettingsBtn.classList.add('active');
        } else {
            teacherSettingsPopover.style.display = 'none';
            if (teacherSettingsBtn) teacherSettingsBtn.classList.remove('active');
        }
    }

    if (teacherSettingsBtn) {
        teacherSettingsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleTeacherSettings();
        });
    }

    if (camCornerSettingsBtn) {
        camCornerSettingsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleTeacherSettings();
        });
    }

    if (closeSettingsBtn) {
        closeSettingsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleTeacherSettings(false);
        });
    }

    // 설정 팝오버 외부 영역 클릭 시 자동으로 닫기
    document.addEventListener('click', (e) => {
        if (teacherSettingsPopover && teacherSettingsPopover.style.display === 'block') {
            const inPopover = teacherSettingsPopover.contains(e.target);
            const onBottomBtn = teacherSettingsBtn && (teacherSettingsBtn === e.target || teacherSettingsBtn.contains(e.target));
            const onCornerBtn = camCornerSettingsBtn && (camCornerSettingsBtn === e.target || camCornerSettingsBtn.contains(e.target));
            if (!inPopover && !onBottomBtn && !onCornerBtn) {
                toggleTeacherSettings(false);
            }
        }
    });

    // 2) 고스트 실루엣 가이드 토글 이벤트
    if (toggleGhostBtn) {
        toggleGhostBtn.addEventListener('click', () => {
            isGhostActive = !isGhostActive;
            if (isGhostActive) {
                toggleGhostBtn.classList.add('active');
                if (ghostStatusText) ghostStatusText.innerText = 'ON';
                if (ghostSubControls) ghostSubControls.style.display = 'flex';
                updateGhostGuide();
            } else {
                toggleGhostBtn.classList.remove('active');
                if (ghostStatusText) ghostStatusText.innerText = 'OFF';
                if (ghostSubControls) ghostSubControls.style.display = 'none';
                if (ghostOverlay) ghostOverlay.style.display = 'none';
                if (ghostCanvas) ghostCanvas.style.display = 'none';
            }
        });
    }

    // 실루엣 스타일 칩 (네온 외곽선 / 투명 고스트 / 네온 실루엣)
    if (guideModeChips) {
        guideModeChips.forEach(chip => {
            chip.addEventListener('click', () => {
                guideModeChips.forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                ghostGuideMode = chip.getAttribute('data-mode') || 'outline';
                updateGhostGuide();
            });
        });
    }

    // 실루엣 선명도 칩 (은은하게 / 보통 / 선명하게)
    if (guideOpacityChips) {
        guideOpacityChips.forEach(chip => {
            chip.addEventListener('click', () => {
                guideOpacityChips.forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                ghostGuideOpacity = parseFloat(chip.getAttribute('data-opacity')) || 0.8;
                updateGhostGuide();
            });
        });
    }

    // 3) 카메라 거울 모드 (좌우 반전) 토글 이벤트
    if (toggleMirrorBtn) {
        toggleMirrorBtn.addEventListener('click', () => {
            isMirrorMode = !isMirrorMode;
            if (isMirrorMode) {
                toggleMirrorBtn.classList.add('active');
                if (mirrorStatusText) mirrorStatusText.innerText = 'ON';
            } else {
                toggleMirrorBtn.classList.remove('active');
                if (mirrorStatusText) mirrorStatusText.innerText = 'OFF';
            }
            applyZoom(currentZoom);
        });
    }

    // 4) 교사용 타이머 칩 (즉시 / 3초 / 5초) 선택 이벤트
    function updateCaptureBtnText() {
        if (selectedTimer === 0) {
            captureBtn.innerText = '📸 즉시 촬영';
        } else {
            captureBtn.innerText = `📸 사진 촬영 (${selectedTimer}초)`;
        }
    }

    timerChips.forEach(chip => {
        chip.addEventListener('click', () => {
            timerChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            selectedTimer = parseInt(chip.getAttribute('data-time'), 10);
            updateCaptureBtnText();
        });
    });

    // 5) AI 관절 인식 (MediaPipe) 토글 이벤트
    if (toggleAiPoseBtn) {
        toggleAiPoseBtn.addEventListener('click', () => {
            isAIPoseActive = !isAIPoseActive;
            if (isAIPoseActive) {
                toggleAiPoseBtn.classList.add('active');
                if (aiPoseStatusText) aiPoseStatusText.innerText = 'ON';
                if (aiPoseSubControls) aiPoseSubControls.style.display = 'flex';
                if (aiPoseHud) aiPoseHud.style.display = 'flex';
                if (skeletonCanvas && isSkeletonVisible) skeletonCanvas.style.display = 'block';
                initMediaPipePose();
                poseTrackingLoop();
            } else {
                toggleAiPoseBtn.classList.remove('active');
                if (aiPoseStatusText) aiPoseStatusText.innerText = 'OFF';
                if (aiPoseSubControls) aiPoseSubControls.style.display = 'none';
                if (aiPoseHud) aiPoseHud.style.display = 'none';
                if (skeletonCanvas) {
                    skeletonCanvas.style.display = 'none';
                    const ctx = skeletonCanvas.getContext('2d');
                    ctx.clearRect(0, 0, skeletonCanvas.width, skeletonCanvas.height);
                }
                if (poseFrameAnimId) {
                    cancelAnimationFrame(poseFrameAnimId);
                    poseFrameAnimId = null;
                }
            }
        });
    }

    // 스켈레톤 라인 표시 토글
    if (toggleSkeletonBtn) {
        toggleSkeletonBtn.addEventListener('click', () => {
            isSkeletonVisible = !isSkeletonVisible;
            if (isSkeletonVisible) {
                toggleSkeletonBtn.classList.add('active');
                toggleSkeletonBtn.innerText = '🦴 스켈레톤 라인 ON';
                if (skeletonCanvas) skeletonCanvas.style.display = 'block';
            } else {
                toggleSkeletonBtn.classList.remove('active');
                toggleSkeletonBtn.innerText = '🦴 스켈레톤 라인 OFF';
                if (skeletonCanvas) {
                    skeletonCanvas.style.display = 'none';
                    const ctx = skeletonCanvas.getContext('2d');
                    ctx.clearRect(0, 0, skeletonCanvas.width, skeletonCanvas.height);
                }
            }
        });
    }

    // AI 자동 촬영 칩 (수동 찰칵 / 85% 시 자동)
    if (aiAutoCaptureChips) {
        aiAutoCaptureChips.forEach(chip => {
            chip.addEventListener('click', () => {
                aiAutoCaptureChips.forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                isAutoCaptureEnabled = chip.getAttribute('data-auto') === 'true';
            });
        });
    }

    // 6) 사진 촬영 (캡처) 버튼 클릭 (원형 프로그레스 링 카운트다운)
    captureBtn.addEventListener('click', () => {
        initAudio();
        toggleTeacherSettings(false); // 촬영 시작 시 설정창 닫기
        captureBtn.disabled = true;
        isCountingDown = true;

        // 즉시 촬영 모드
        if (selectedTimer === 0) {
            takeSnapshot();
            return;
        }

        let count = selectedTimer;
        const totalDuration = selectedTimer;
        countdownOverlay.style.display = 'flex';

        function updateRing(current, total) {
            if (!countdownRingProgress) return;
            const progress = (total - current) / total;
            countdownRingProgress.style.strokeDashoffset = (ringCircumference * progress).toString();
            countdownRingProgress.style.stroke = countColors[current] || '#facc15';
        }

        countdownText.innerText = count;
        countdownText.style.color = countColors[count] || '#ffd700';
        updateRing(count, totalDuration);
        playCountdownFx(count);
        speakCountdown(count);

        const timer = setInterval(() => {
            count--;
            if (count > 0) {
                countdownText.style.animation = 'none';
                countdownText.offsetHeight; /* trigger reflow */
                countdownText.style.animation = null;

                countdownText.innerText = count;
                countdownText.style.color = countColors[count] || '#ffd700';
                updateRing(count, totalDuration);
                playCountdownFx(count);
                speakCountdown(count);
            } else {
                clearInterval(timer);
                countdownOverlay.style.display = 'none';
                takeSnapshot();
            }
        }, 1000);
    });

    // 6) 스냅샷 촬영
    function takeSnapshot() {
        playSmartphoneShutter();
        triggerCameraFlash();

        // 캔버스 크기를 비디오 원본 크기에 맞춤 (기기별 해상도 대응)
        const vWidth = cameraFeed.videoWidth || 1280;
        const vHeight = cameraFeed.videoHeight || 720;

        snapshotCanvas.width = vWidth;
        snapshotCanvas.height = vHeight;

        const ctx = snapshotCanvas.getContext('2d');
        ctx.save();

        // 거울 모드일 때만 좌우 반전하여 촬영
        if (isMirrorMode) {
            ctx.translate(vWidth, 0);
            ctx.scale(-1, 1);
        }

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

        // UI 상태 전환 (촬영 완료 시 팝오버, 줌, 모서리기어, 고스트 실루엣, 스켈레톤, HUD 숨김)
        snapshotCanvas.style.display = 'block';
        toggleTeacherSettings(false);
        if (ghostOverlay) ghostOverlay.style.display = 'none';
        if (ghostCanvas) ghostCanvas.style.display = 'none';
        if (skeletonCanvas) skeletonCanvas.style.display = 'none';
        if (aiPoseHud) aiPoseHud.style.display = 'none';
        if (camCornerSettingsBtn) camCornerSettingsBtn.style.display = 'none';
        if (zoomControls) zoomControls.style.display = 'none';
        captureBtn.style.display = 'none';
        if (teacherSettingsBtn) teacherSettingsBtn.style.display = 'none';
        nextBtn.style.display = 'block';
        isCountingDown = false;
    }

    // 7) 캡처 상태 초기화
    function resetCaptureState() {
        snapshotCanvas.style.display = 'none'; // 실시간 비디오 복원
        if (isGhostActive) {
            updateGhostGuide();
        }
        if (isAIPoseActive) {
            if (skeletonCanvas && isSkeletonVisible) skeletonCanvas.style.display = 'block';
            if (aiPoseHud) aiPoseHud.style.display = 'flex';
        }
        if (camCornerSettingsBtn) camCornerSettingsBtn.style.display = 'flex'; // 기어 복원
        if (zoomControls) zoomControls.style.display = 'flex'; // 줌 복원
        if (teacherSettingsBtn) teacherSettingsBtn.style.display = 'block'; // 교사 설정 복원
        captureBtn.style.display = 'block';
        captureBtn.disabled = false;
        nextBtn.style.display = 'none';
        updateCaptureBtnText();
    }

    // 다음 동작 버튼 클릭 (무작위 다음 동작 선택)
    nextBtn.addEventListener('click', () => {
        pickNextRandomPose();
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

    // ==========================================================
    // iOS 사파리 대응 및 전체화면 버튼 제어 (옵션 A)
    // ==========================================================
    const urlParams = new URLSearchParams(window.location.search);
    const isIOSTest = urlParams.get('test_ios') === '1' || urlParams.get('inapp') === 'ios';
    const isIOSDevice = /iphone|ipad|ipod/i.test(navigator.userAgent) || isIOSTest;
    const isStandaloneMode = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;

    const iosPwaModal = document.getElementById('ios-pwa-modal');
    const iosModalCloseX = document.getElementById('ios-modal-close-x');
    const iosModalConfirmBtn = document.getElementById('ios-modal-confirm-btn');

    function closeIosModal() {
        if (iosPwaModal) iosPwaModal.style.display = 'none';
    }
    function openIosModal() {
        if (iosPwaModal) iosPwaModal.style.display = 'flex';
    }

    if (iosModalCloseX) iosModalCloseX.addEventListener('click', closeIosModal);
    if (iosModalConfirmBtn) iosModalConfirmBtn.addEventListener('click', closeIosModal);
    if (iosPwaModal) {
        iosPwaModal.addEventListener('click', (e) => {
            if (e.target === iosPwaModal) closeIosModal();
        });
    }

    if (isIOSDevice) {
        if (isStandaloneMode) {
            // 이미 '홈 화면에 추가'되어 100% 전체화면 앱으로 실행 중인 경우
            fullscreenBtn.style.display = 'none';
        } else {
            // iOS 사파리 브라우저: 실행 불가능한 '전체화면' 대신 '홈화면 추가(전체화면)' 안내 버튼으로 변환
            fullscreenBtn.innerText = '📲 홈화면 추가 (전체화면)';
            fullscreenBtn.classList.add('ios-pwa-btn');
            fullscreenBtn.title = '아이폰 전체화면 앱으로 실행하는 방법';

            fullscreenBtn.addEventListener('click', () => {
                openIosModal();
            });
        }
    } else {
        // Android, Windows, Mac 등 일반 브라우저: 표준 HTML5 Fullscreen API 동작
        function getFullscreenElement() {
            return document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
        }

        fullscreenBtn.addEventListener('click', () => {
            const docElm = document.documentElement;
            if (!getFullscreenElement()) {
                if (docElm.requestFullscreen) {
                    docElm.requestFullscreen().catch(err => {
                        console.error("전체화면 에러:", err);
                    });
                } else if (docElm.webkitRequestFullscreen) {
                    docElm.webkitRequestFullscreen();
                } else if (docElm.msRequestFullscreen) {
                    docElm.msRequestFullscreen();
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

        function handleFullscreenChange() {
            if (getFullscreenElement()) {
                fullscreenBtn.innerText = '🪟 창모드로 전환';
                fullscreenBtn.title = '창모드로 복귀하기';
            } else {
                fullscreenBtn.innerText = '📺 전체화면';
                fullscreenBtn.title = '전체화면으로 전환하기';
            }
        }

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('mozfullscreenchange', handleFullscreenChange);
        document.addEventListener('MSFullscreenChange', handleFullscreenChange);

        window.addEventListener('beforeunload', () => {
            stopCamera(true);
        });
    }
});
