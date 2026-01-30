/* ============================================
   STEPS TO MILES CALCULATOR - JAVASCRIPT
   ============================================ */

// Constants
const FEET_PER_MILE = 5280;
const METERS_PER_KM = 1000;
const KM_PER_MILE = 1.60934;

// Default stride lengths by activity (as percentage of height)
const STRIDE_PERCENT = {
  walking: 0.415,
  running: 0.52
};

// Average steps per mile reference
const AVG_STEPS_PER_MILE = {
  walking: 2100,
  running: 1600
};

// Calories per step (rough estimate)
const CALORIES_PER_STEP = {
  walking: 0.04,
  running: 0.06
};

// Initialize
document.addEventListener('DOMContentLoaded', init);

function init() {
  setupTabs();
  setupPresets();
  setupCalculateButtons();
  setupFAQ();
  setupMobileNav();
}

function setupTabs() {
  document.querySelectorAll('.calc-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const tabId = tab.dataset.tab;
      document.querySelectorAll('.calc-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      document.querySelectorAll('.calc-panel').forEach(p => p.classList.remove('active'));
      document.getElementById(`panel-${tabId}`).classList.add('active');
    });
  });
}

function setupPresets() {
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const panel = btn.closest('.calc-panel');
      panel.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const value = btn.dataset.value;
      const input = panel.querySelector('.steps-input') || panel.querySelector('.miles-input');
      if (input && value) {
        input.value = value;
      }
    });
  });
}

function setupCalculateButtons() {
  document.getElementById('calc-steps-btn')?.addEventListener('click', calculateStepsToMiles);
  document.getElementById('calc-miles-btn')?.addEventListener('click', calculateMilesToSteps);
  document.getElementById('calc-spm-btn')?.addEventListener('click', calculateStepsPerMile);
}

// ============================================
// TAB 1: STEPS TO MILES
// ============================================
function calculateStepsToMiles() {
  const steps = parseInt(document.getElementById('steps-input')?.value) || 0;
  const activity = document.querySelector('input[name="activity"]:checked')?.value || 'walking';
  const strideMethod = document.querySelector('input[name="stride-method"]:checked')?.value || 'height';
  
  if (steps <= 0) {
    alert('Please enter the number of steps');
    return;
  }
  
  let strideLengthFeet;
  
  if (strideMethod === 'custom') {
    const customStride = parseFloat(document.getElementById('custom-stride')?.value) || 0;
    const strideUnit = document.getElementById('stride-unit')?.value || 'inches';
    
    if (customStride <= 0) {
      alert('Please enter your stride length');
      return;
    }
    
    strideLengthFeet = strideUnit === 'inches' ? customStride / 12 : customStride / 30.48;
  } else {
    // Calculate from height
    const heightFeet = parseInt(document.getElementById('height-feet')?.value) || 5;
    const heightInches = parseInt(document.getElementById('height-inches')?.value) || 6;
    const totalHeightFeet = heightFeet + (heightInches / 12);
    
    strideLengthFeet = totalHeightFeet * STRIDE_PERCENT[activity];
  }
  
  // Calculate distance
  const totalFeet = steps * strideLengthFeet;
  const miles = totalFeet / FEET_PER_MILE;
  const km = miles * KM_PER_MILE;
  
  // Estimate calories (rough)
  const calories = Math.round(steps * CALORIES_PER_STEP[activity]);
  
  // Estimate time (assuming avg pace)
  const avgMph = activity === 'walking' ? 3.0 : 6.0;
  const timeHours = miles / avgMph;
  const timeMinutes = Math.round(timeHours * 60);
  
  // Steps per mile for this stride
  const stepsPerMile = Math.round(FEET_PER_MILE / strideLengthFeet);
  
  // Get height for display
  const heightFeet = parseInt(document.getElementById('height-feet')?.value) || 5;
  const heightInches = parseInt(document.getElementById('height-inches')?.value) || 6;

  displayStepsResults({
    steps,
    miles: miles.toFixed(2),
    km: km.toFixed(2),
    calories,
    timeMinutes,
    strideLengthFeet,
    stepsPerMile,
    activity,
    heightFeet,
    heightInches
  });
}

function displayStepsResults(results) {
  const section = document.getElementById('steps-results');
  if (!section) return;

  // Primary result
  document.getElementById('miles-value').textContent = results.miles;
  document.getElementById('km-value').textContent = results.km + ' km';

  // Update 10K goal progress
  const goalSteps = 10000;
  const percent = Math.min(100, Math.round((results.steps / goalSteps) * 100));
  const remaining = Math.max(0, goalSteps - results.steps);
  const remainingMiles = (remaining * results.strideLengthFeet / FEET_PER_MILE).toFixed(1);

  document.getElementById('goal-percent').textContent = percent + '%';
  document.getElementById('goal-fill').style.width = percent + '%';

  if (results.steps >= goalSteps) {
    document.getElementById('goal-note').textContent = '🎉 Congratulations! You\'ve reached your 10,000 step goal!';
  } else {
    document.getElementById('goal-note').textContent = `${remaining.toLocaleString()} steps to go (≈ ${remainingMiles} miles)`;
  }

  // Summary table
  const strideInches = (results.strideLengthFeet * 12).toFixed(1);
  const strideCm = (results.strideLengthFeet * 30.48).toFixed(1);

  document.getElementById('summary-distance').textContent = results.miles + ' mi (' + results.km + ' km)';
  document.getElementById('summary-steps').textContent = results.steps.toLocaleString();
  document.getElementById('summary-calories').textContent = results.calories + ' calories';
  document.getElementById('summary-time').textContent = formatTime(results.timeMinutes);
  document.getElementById('summary-spm').textContent = results.stepsPerMile.toLocaleString() + ' steps/mile';
  document.getElementById('summary-stride').textContent = strideInches + ' in (' + strideCm + ' cm)';

  // Input summary
  document.getElementById('input-steps-display').textContent = results.steps.toLocaleString();
  document.getElementById('input-activity-display').textContent = results.activity === 'walking' ? 'Walking' : 'Running';
  document.getElementById('input-height-display').textContent = results.heightFeet + "'" + results.heightInches + '"';

  // Generate personalized tips
  generateTips(results);

  // Generate interpretation
  generateInterpretation(results);

  section.classList.add('visible');
}

function formatTime(minutes) {
  if (minutes < 60) return minutes + ' minutes';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return hours + (hours === 1 ? ' hour' : ' hours');
  return hours + 'h ' + mins + 'm';
}

function generateTips(results) {
  const tips = [];

  // Tip 1: Goal-related
  const goalPercent = (results.steps / 10000) * 100;
  if (goalPercent >= 100) {
    tips.push({
      title: 'Goal Achieved!',
      text: 'Great job hitting 10K steps! Consider increasing your goal to 12,000 or 15,000 for extra benefits.'
    });
  } else if (goalPercent >= 75) {
    tips.push({
      title: 'Almost There!',
      text: 'You\'re ' + (10000 - results.steps).toLocaleString() + ' steps away from your goal. A short walk will get you there!'
    });
  } else if (goalPercent >= 50) {
    tips.push({
      title: 'Halfway There',
      text: 'You\'ve completed ' + Math.round(goalPercent) + '% of your goal. Keep moving to reach 10,000 steps!'
    });
  } else {
    tips.push({
      title: 'Keep Moving',
      text: 'Every step counts! Try adding a short walk after meals to boost your daily count.'
    });
  }

  // Tip 2: Time-related
  if (results.timeMinutes >= 60) {
    tips.push({
      title: 'Great Workout Duration',
      text: 'You\'ve been active for ' + formatTime(results.timeMinutes) + '. This exceeds recommended daily activity time!'
    });
  } else if (results.timeMinutes >= 30) {
    tips.push({
      title: 'Meeting Guidelines',
      text: 'Your ' + results.timeMinutes + ' minutes of activity meets CDC recommendations for daily exercise.'
    });
  } else {
    tips.push({
      title: 'Build Up Gradually',
      text: 'Aim for 30 minutes of activity daily. Try adding a 10-minute walk to your routine.'
    });
  }

  // Tip 3: Calories
  if (results.calories >= 300) {
    tips.push({
      title: 'Solid Calorie Burn',
      text: 'You\'ve burned approximately ' + results.calories + ' calories—equivalent to a small meal!'
    });
  } else {
    tips.push({
      title: 'Calorie Insight',
      text: 'At ' + results.calories + ' cal, consider adding more steps if weight management is your goal.'
    });
  }

  // Tip 4: Distance milestone
  const milesNum = parseFloat(results.miles);
  if (milesNum >= 5) {
    tips.push({
      title: '5+ Miles!',
      text: 'You\'ve covered ' + results.miles + ' miles—that\'s significant distance. Great for cardiovascular health!'
    });
  } else if (milesNum >= 3) {
    tips.push({
      title: 'Solid Distance',
      text: 'At ' + results.miles + ' miles, you\'re getting meaningful cardiovascular benefits.'
    });
  } else {
    tips.push({
      title: 'Every Mile Matters',
      text: 'Your ' + results.miles + ' miles contribute to better health. Consistency is key!'
    });
  }

  // Update DOM
  tips.forEach((tip, i) => {
    if (document.getElementById('tip-' + (i + 1) + '-title')) {
      document.getElementById('tip-' + (i + 1) + '-title').textContent = tip.title;
      document.getElementById('tip-' + (i + 1) + '-text').textContent = tip.text;
    }
  });
}

function generateInterpretation(results) {
  const milesNum = parseFloat(results.miles);
  const goalPercent = (results.steps / 10000) * 100;
  let interpretation = '';

  if (goalPercent >= 100) {
    interpretation = `Excellent! Your ${results.steps.toLocaleString()} steps covered ${results.miles} miles (${results.km} km)—that's above the popular 10,000-step daily goal. `;
  } else {
    interpretation = `Your ${results.steps.toLocaleString()} steps covered ${results.miles} miles (${results.km} km), which is ${Math.round(goalPercent)}% of the 10,000-step daily target. `;
  }

  // Add context about distance
  if (milesNum >= 4) {
    interpretation += 'This is equivalent to walking to a destination about ' + (milesNum / 2).toFixed(1) + ' miles away and back. ';
  } else if (milesNum >= 2) {
    interpretation += 'This is roughly the distance of walking around a typical neighborhood block 8-10 times. ';
  } else {
    interpretation += 'This is about the distance you might cover during light daily activities like shopping or household tasks. ';
  }

  // Add health context
  if (results.activity === 'running') {
    interpretation += 'Since you were running, you covered more ground per step than walking would, with higher calorie expenditure.';
  } else {
    interpretation += 'Walking at a moderate pace provides cardiovascular benefits while being gentle on your joints.';
  }

  document.getElementById('interpretation-text').textContent = interpretation;
}

// ============================================
// TAB 2: MILES TO STEPS
// ============================================
function calculateMilesToSteps() {
  const distance = parseFloat(document.getElementById('miles-input')?.value) || 0;
  const distanceUnit = document.getElementById('distance-unit')?.value || 'miles';
  const activity = document.querySelector('input[name="activity2"]:checked')?.value || 'walking';
  const strideMethod = document.querySelector('input[name="stride-method2"]:checked')?.value || 'height';
  
  if (distance <= 0) {
    alert('Please enter a distance');
    return;
  }
  
  // Convert to miles if needed
  const miles = distanceUnit === 'km' ? distance / KM_PER_MILE : distance;
  
  let strideLengthFeet;
  
  if (strideMethod === 'custom') {
    const customStride = parseFloat(document.getElementById('custom-stride2')?.value) || 0;
    const strideUnit = document.getElementById('stride-unit2')?.value || 'inches';
    
    if (customStride <= 0) {
      alert('Please enter your stride length');
      return;
    }
    
    strideLengthFeet = strideUnit === 'inches' ? customStride / 12 : customStride / 30.48;
  } else {
    const heightFeet = parseInt(document.getElementById('height-feet2')?.value) || 5;
    const heightInches = parseInt(document.getElementById('height-inches2')?.value) || 6;
    const totalHeightFeet = heightFeet + (heightInches / 12);
    
    strideLengthFeet = totalHeightFeet * STRIDE_PERCENT[activity];
  }
  
  const totalFeet = miles * FEET_PER_MILE;
  const steps = Math.round(totalFeet / strideLengthFeet);
  const stepsPerMile = Math.round(FEET_PER_MILE / strideLengthFeet);

  // Goal comparison
  const goalPercent = Math.round((steps / 10000) * 100);

  displayMilesResults({
    miles: miles.toFixed(2),
    km: (miles * KM_PER_MILE).toFixed(2),
    steps,
    stepsPerMile,
    strideLengthFeet,
    goalPercent,
    activity
  });
}

function displayMilesResults(results) {
  const section = document.getElementById('miles-results');
  if (!section) return;

  // Primary result
  document.getElementById('steps-value').textContent = results.steps.toLocaleString();
  document.getElementById('miles-input-display').textContent = results.miles + ' mi = ' + results.km + ' km';

  // Progress bar
  const percent = Math.min(100, results.goalPercent);
  document.getElementById('m2s-goal-percent').textContent = results.goalPercent + '%';
  document.getElementById('m2s-goal-fill').style.width = percent + '%';

  if (results.goalPercent >= 100) {
    document.getElementById('m2s-goal-note').textContent = 'This distance exceeds the 10,000-step goal!';
  } else {
    document.getElementById('m2s-goal-note').textContent = 'This distance is ' + results.goalPercent + '% of the daily 10K goal';
  }

  // Summary table
  const stepsPerKm = Math.round(results.stepsPerMile / KM_PER_MILE);
  document.getElementById('m2s-summary-steps').textContent = results.steps.toLocaleString();
  document.getElementById('m2s-summary-distance').textContent = results.miles + ' mi (' + results.km + ' km)';
  document.getElementById('m2s-summary-spm').textContent = results.stepsPerMile.toLocaleString();
  document.getElementById('m2s-summary-spkm').textContent = stepsPerKm.toLocaleString();

  // Calculate stride for display
  const strideFeet = FEET_PER_MILE / results.stepsPerMile;
  const strideInches = (strideFeet * 12).toFixed(1);
  const strideCm = (strideFeet * 30.48).toFixed(1);
  document.getElementById('m2s-summary-stride').textContent = strideInches + ' in (' + strideCm + ' cm)';

  // Input summary
  const distanceInput = document.getElementById('miles-input')?.value || '--';
  const distanceUnit = document.getElementById('distance-unit')?.value || 'miles';
  const activity = document.querySelector('input[name="activity2"]:checked')?.value || 'walking';
  const heightFeet = parseInt(document.getElementById('height-feet2')?.value) || 5;
  const heightInches = parseInt(document.getElementById('height-inches2')?.value) || 6;

  document.getElementById('m2s-input-distance').textContent = distanceInput + ' ' + distanceUnit;
  document.getElementById('m2s-input-activity').textContent = activity === 'walking' ? 'Walking' : 'Running';
  document.getElementById('m2s-input-height').textContent = heightFeet + "'" + heightInches + '"';

  // Generate interpretation
  generateMilesInterpretation(results);

  section.classList.add('visible');
}

function generateMilesInterpretation(results) {
  const milesNum = parseFloat(results.miles);
  let interpretation = '';

  interpretation = `To cover ${results.miles} miles (${results.km} km), you'll need approximately ${results.steps.toLocaleString()} steps. `;

  // Context about the distance
  if (milesNum >= 13.1) {
    interpretation += 'This is half-marathon distance—a significant athletic achievement! ';
  } else if (milesNum >= 6.2) {
    interpretation += 'This is 10K race distance, a popular fitness milestone. ';
  } else if (milesNum >= 3.1) {
    interpretation += 'This is about 5K distance, a great workout distance. ';
  } else if (milesNum >= 2) {
    interpretation += 'This is a solid walking workout distance. ';
  } else {
    interpretation += 'This is a comfortable walking distance for most people. ';
  }

  // Goal context
  if (results.goalPercent >= 100) {
    interpretation += 'Walking this distance alone would exceed your daily 10,000-step goal!';
  } else if (results.goalPercent >= 50) {
    interpretation += 'This would get you ' + results.goalPercent + '% toward the daily 10K step goal.';
  } else {
    interpretation += 'You\'ll need additional walking to reach the 10,000-step goal.';
  }

  document.getElementById('m2s-interpretation-text').textContent = interpretation;
}

// ============================================
// TAB 3: STEPS PER MILE
// ============================================
function calculateStepsPerMile() {
  const activity = document.querySelector('input[name="activity3"]:checked')?.value || 'walking';
  const strideMethod = document.querySelector('input[name="stride-method3"]:checked')?.value || 'height';
  
  let strideLengthFeet;
  let heightDisplay = '';
  
  if (strideMethod === 'custom') {
    const customStride = parseFloat(document.getElementById('custom-stride3')?.value) || 0;
    const strideUnit = document.getElementById('stride-unit3')?.value || 'inches';
    
    if (customStride <= 0) {
      alert('Please enter your stride length');
      return;
    }
    
    strideLengthFeet = strideUnit === 'inches' ? customStride / 12 : customStride / 30.48;
    heightDisplay = 'Custom stride';
  } else {
    const heightFeet = parseInt(document.getElementById('height-feet3')?.value) || 5;
    const heightInches = parseInt(document.getElementById('height-inches3')?.value) || 6;
    const totalHeightFeet = heightFeet + (heightInches / 12);
    
    strideLengthFeet = totalHeightFeet * STRIDE_PERCENT[activity];
    heightDisplay = `${heightFeet}'${heightInches}"`;
  }
  
  const stepsPerMile = Math.round(FEET_PER_MILE / strideLengthFeet);
  const stepsPerKm = Math.round(stepsPerMile / KM_PER_MILE);
  const strideInches = (strideLengthFeet * 12).toFixed(1);
  const strideCm = (strideLengthFeet * 30.48).toFixed(1);
  
  displaySPMResults({
    stepsPerMile,
    stepsPerKm,
    strideInches,
    strideCm,
    activity,
    heightDisplay
  });
  
  // Generate reference table
  generateSPMTable(activity);
}

function displaySPMResults(results) {
  const section = document.getElementById('spm-results');
  if (!section) return;

  // Primary result
  document.getElementById('spm-value').textContent = results.stepsPerMile.toLocaleString();
  document.getElementById('spm-activity').textContent = results.activity === 'walking' ? 'Walking' : 'Running';

  // Summary table
  document.getElementById('spm-summary-spm').textContent = results.stepsPerMile.toLocaleString();
  document.getElementById('spm-summary-spkm').textContent = results.stepsPerKm.toLocaleString();
  document.getElementById('spm-summary-stride').textContent = results.strideInches + ' in (' + results.strideCm + ' cm)';
  document.getElementById('spm-summary-activity').textContent = results.activity === 'walking' ? 'Walking' : 'Running';
  document.getElementById('spm-summary-height').textContent = results.heightDisplay;

  // Input summary
  const strideMethod = document.querySelector('input[name="stride-method3"]:checked')?.value || 'height';
  document.getElementById('spm-input-activity').textContent = results.activity === 'walking' ? 'Walking' : 'Running';
  document.getElementById('spm-input-height').textContent = results.heightDisplay;
  document.getElementById('spm-input-source').textContent = strideMethod === 'custom' ? 'Custom stride' : 'Height-based estimate';

  // Generate interpretation
  generateSPMInterpretation(results);

  section.classList.add('visible');
}

function generateSPMInterpretation(results) {
  let interpretation = '';

  interpretation = `Based on your ${results.activity}, you take approximately ${results.stepsPerMile.toLocaleString()} steps per mile (${results.stepsPerKm.toLocaleString()} per km). `;

  // Compare to average
  const avgSPM = AVG_STEPS_PER_MILE[results.activity];
  const diff = results.stepsPerMile - avgSPM;
  const diffPercent = Math.abs(Math.round((diff / avgSPM) * 100));

  if (Math.abs(diff) < 100) {
    interpretation += 'This is very close to the population average of ' + avgSPM.toLocaleString() + ' steps per mile. ';
  } else if (diff > 0) {
    interpretation += 'This is ' + diffPercent + '% more than the average of ' + avgSPM.toLocaleString() + ' (shorter stride). ';
  } else {
    interpretation += 'This is ' + diffPercent + '% fewer than the average of ' + avgSPM.toLocaleString() + ' (longer stride). ';
  }

  // Practical context
  interpretation += 'To reach 10,000 steps, you\'d need to ' + results.activity + ' about ' + (10000 / results.stepsPerMile).toFixed(1) + ' miles.';

  document.getElementById('spm-interpretation-text').textContent = interpretation;
}

function generateSPMTable(activity) {
  const tbody = document.getElementById('spm-table-body');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  // Heights from 5'0" to 6'4"
  const heights = [
    { ft: 5, in: 0 }, { ft: 5, in: 2 }, { ft: 5, in: 4 },
    { ft: 5, in: 6 }, { ft: 5, in: 8 }, { ft: 5, in: 10 },
    { ft: 6, in: 0 }, { ft: 6, in: 2 }, { ft: 6, in: 4 }
  ];
  
  heights.forEach(h => {
    const totalFeet = h.ft + (h.in / 12);
    const walkingStride = totalFeet * STRIDE_PERCENT.walking;
    const runningStride = totalFeet * STRIDE_PERCENT.running;
    
    const walkingSPM = Math.round(FEET_PER_MILE / walkingStride);
    const runningSPM = Math.round(FEET_PER_MILE / runningStride);
    
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><strong>${h.ft}'${h.in}"</strong></td>
      <td>${(walkingStride * 12).toFixed(1)}" / ${(runningStride * 12).toFixed(1)}"</td>
      <td>${walkingSPM.toLocaleString()}</td>
      <td>${runningSPM.toLocaleString()}</td>
    `;
    tbody.appendChild(row);
  });
}

// ============================================
// UTILITY
// ============================================
function setupFAQ() {
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const wasOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
      if (!wasOpen) item.classList.add('open');
    });
  });
}

function setupMobileNav() {
  const toggle = document.querySelector('.nav-toggle');
  const mobileNav = document.querySelector('.nav-mobile');
  if (toggle && mobileNav) {
    toggle.addEventListener('click', () => mobileNav.classList.toggle('active'));
    document.addEventListener('click', (e) => {
      if (!toggle.contains(e.target) && !mobileNav.contains(e.target)) {
        mobileNav.classList.remove('active');
      }
    });
  }
}
