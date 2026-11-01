let airChartInstance = null; // 차트 중복 생성 방지용 전역 변수

document.addEventListener('DOMContentLoaded', () => {
  const sidoSelect = document.getElementById('sido-select');

  // 이전 선택 기록이 남아있는지 LocalStorage 확인
  const savedData = localStorage.getItem('selectedAirData');
  let initialSido = '서울'; // 기본값

  if (savedData) {
    try {
      const parsedData = JSON.parse(savedData);
      if (parsedData && parsedData.sidoName) {
        initialSido = parsedData.sidoName;
      }
    } catch (e) {
      console.error('LocalStorage 데이터 파싱 오류:', e);
    }
  }

  sidoSelect.value = initialSido;
  fetchAirData(initialSido);

  sidoSelect.addEventListener('change', (event) => {
    fetchAirData(event.target.value);
  });
});

async function fetchAirData(sidoName) {
  const stationNameElem = document.getElementById('station-name');
  stationNameElem.innerText = `${sidoName} 지역 데이터를 불러오는 중...`;

  const url = `https://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getCtprvnRltmMesureDnsty?serviceKey=${API_KEY}&returnType=json&numOfRows=20&pageNo=1&sidoName=${encodeURIComponent(sidoName)}&ver=1.0`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!data.response || !data.response.body || !data.response.body.items || data.response.body.items.length === 0) {
      throw new Error('API 응답 데이터가 없습니다.');
    }

    const items = data.response.body.items;
    
    // 점검 중('-')이 아닌 유효한 미세먼지 수치를 가진 측정소 탐색
    let validItem = items.find(item => item.pm10Value && item.pm10Value !== '-');
    
    // 만약 모든 측정소가 점검 중이면 첫 번째 측정소 사용
    if (!validItem) {
      validItem = items[0];
    }

    validItem.sidoName = sidoName;

    updateUI(validItem);
    renderChart(validItem);
  } catch (error) {
    console.error('API 호출 에러:', error);
    stationNameElem.innerText = '데이터를 불러올 수 없습니다. (API 키 및 네트워크 상태 확인 필요)';
  }
}

function updateUI(item) {
  const isMaintenance = !item.pm10Value || item.pm10Value === '-';
  
  document.getElementById('station-name').innerText = `측정위치: ${item.stationName} (${item.dataTime || '최신'} 기준) ${isMaintenance ? '[장비 점검중]' : ''}`;
  document.getElementById('pm10-value').innerText = item.pm10Value || '-';
  document.getElementById('pm25-value').innerText = item.pm25Value || '-';

  const statusBadge = document.getElementById('pm10-status');
  
  if (isMaintenance) {
    statusBadge.innerText = '점검중';
    statusBadge.className = 'status-badge normal';
  } else {
    const pm10 = parseInt(item.pm10Value) || 0;
    if (pm10 <= 30) {
      statusBadge.innerText = '좋음';
      statusBadge.className = 'status-badge good';
    } else if (pm10 <= 80) {
      statusBadge.innerText = '보통';
      statusBadge.className = 'status-badge normal';
    } else if (pm10 <= 150) {
      statusBadge.innerText = '나쁨';
      statusBadge.className = 'status-badge bad';
    } else {
      statusBadge.innerText = '매우 나쁨';
      statusBadge.className = 'status-badge very-bad';
    }
  }

  localStorage.setItem('selectedAirData', JSON.stringify(item));
}

function safeParseFloat(value) {
  if (!value || value === '-' || isNaN(value)) {
    return 0;
  }
  return parseFloat(value);
}

function renderChart(item) {
  if (typeof Chart === 'undefined') {
    console.error('Chart.js 라이브러리가 로드되지 않았습니다.');
    return;
  }

  const canvas = document.getElementById('airChart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  const pm10Val = safeParseFloat(item.pm10Value);
  const pm25Val = safeParseFloat(item.pm25Value);
  const o3Val = safeParseFloat(item.o3Value) * 1000;

  if (airChartInstance) {
    airChartInstance.destroy();
  }

  airChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['미세먼지(PM10)', '초미세먼지(PM2.5)', '오존(O3x1000)'],
      datasets: [{
        label: `${item.stationName} 주요 오염물질 수치`,
        data: [pm10Val, pm25Val, o3Val],
        backgroundColor: [
          'rgba(52, 152, 219, 0.8)',
          'rgba(230, 126, 34, 0.8)',
          'rgba(155, 89, 182, 0.8)'
        ],
        borderColor: [
          '#2980b9',
          '#d35400',
          '#8e44ad'
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}