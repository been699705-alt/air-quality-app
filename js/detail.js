document.addEventListener('DOMContentLoaded', () => {
  const savedData = localStorage.getItem('selectedAirData');

  if (!savedData) {
    document.getElementById('guide-box').innerHTML = '<p>대시보드에서 데이터를 먼저 조회해 주세요.</p>';
    return;
  }

  const data = JSON.parse(savedData);
  displayDetailAndGuide(data);
});

function displayDetailAndGuide(item) {
  document.getElementById('detail-title').innerText = `${item.stationName} 지역 맞춤 행동 가이드`;

  const pm10 = parseInt(item.pm10Value) || 0;
  let outdoorGuide = '';
  let ventilationGuide = '';

  // 수치 기반 행동 추천 알고리즘
  if (pm10 <= 30) {
    outdoorGuide = '🏃 **야외 활동**: 야외 운동 및 산책을 하기 매우 좋은 날씨입니다.';
    ventilationGuide = '🪟 **실내 환기**: 하루 종일 자유롭게 실내 환기를 실시해도 좋습니다.';
  } else if (pm10 <= 80) {
    outdoorGuide = '🚶 **야외 활동**: 무난한 날씨이나 호흡기 민감군은 장시간 야외활동 시 주의하세요.';
    ventilationGuide = '🪟 **실내 환기**: 하루 3회, 30분씩 환기하는 것을 추천합니다.';
  } else {
    outdoorGuide = '😷 **야외 활동**: KF80 이상의 마스크를 꼭 착용하시고 장시간 야외 활동을 자제하세요.';
    ventilationGuide = '🚫 **실내 환기**: 외부 환기를 자제하고 공기청정기를 가동하세요.';
  }

  document.getElementById('guide-box').innerHTML = `
    <p style="font-size: 1.1em; margin-bottom: 10px;">${outdoorGuide}</p>
    <p style="font-size: 1.1em;">${ventilationGuide}</p>
  `;

  // 상세 오염물질 지수 리스트 출력
  const list = document.getElementById('detail-list');
  list.innerHTML = `
    <li>아황산가스(SO2) 농도: <strong>${item.so2Value || '-'} ppm</strong></li>
    <li>일산화탄소(CO) 농도: <strong>${item.coValue || '-'} ppm</strong></li>
    <li>오존(O3) 농도: <strong>${item.o3Value || '-'} ppm</strong></li>
    <li>이산화질소(NO2) 농도: <strong>${item.no2Value || '-'} ppm</strong></li>
  `;
}