// State Management
const state = {
    quantity: 4,
    weight: 280,
    hydration: 65,
    salt: 3,
    yeast: 0.5,
    oil: 0,
    sugar: 0,
    // Advanced
    prefermentPct: 0,
    prefermentHydration: 100,
    tempRoom: 24,
    tempFlour: 23,
    tempFriction: 26,
    tempTarget: 25,
    costFlour: 1.50,
    costToppings: 2.00
};

// DOM Elements
const inputs = {
    quantity: document.getElementById('quantity'),
    weight: document.getElementById('weight'),
    hydration: document.getElementById('hydration'),
    hydrationSlider: document.getElementById('hydration-slider'),
    salt: document.getElementById('salt'),
    saltSlider: document.getElementById('salt-slider'),
    yeast: document.getElementById('yeast'),
    yeastSlider: document.getElementById('yeast-slider'),
    oil: document.getElementById('oil'),
    oilSlider: document.getElementById('oil-slider'),
    sugar: document.getElementById('sugar'),
    sugarSlider: document.getElementById('sugar-slider'),
    // Advanced
    prefermentPct: document.getElementById('preferment-pct'),
    prefermentHydration: document.getElementById('preferment-hydration'),
    tempRoom: document.getElementById('temp-room'),
    tempFlour: document.getElementById('temp-flour'),
    tempFriction: document.getElementById('temp-friction'),
    tempTarget: document.getElementById('temp-target'),
    costFlour: document.getElementById('cost-flour'),
    costToppings: document.getElementById('cost-toppings'),
};

const outputs = {
    totalWeight: document.getElementById('total-dough-weight'),
    recipeBody: document.getElementById('recipe-body'),
    waterTempResult: document.getElementById('water-temp-result'),
    costPerBall: document.getElementById('cost-per-ball')
};

const toggleAdvancedBtn = document.getElementById('toggle-advanced');
const advancedSection = document.getElementById('advanced-options');

// Initialization
function init() {
    setupEventListeners();
    calculate();
}

function setupEventListeners() {
    // Sync Sliders and Inputs
    syncInputPair(inputs.hydration, inputs.hydrationSlider, 'hydration');
    syncInputPair(inputs.salt, inputs.saltSlider, 'salt');
    syncInputPair(inputs.yeast, inputs.yeastSlider, 'yeast');
    syncInputPair(inputs.oil, inputs.oilSlider, 'oil');
    syncInputPair(inputs.sugar, inputs.sugarSlider, 'sugar');

    // Direct Inputs
    inputs.quantity.addEventListener('input', (e) => updateState('quantity', parseFloat(e.target.value)));
    inputs.weight.addEventListener('input', (e) => updateState('weight', parseFloat(e.target.value)));

    // Advanced Inputs
    inputs.prefermentPct.addEventListener('input', (e) => updateState('prefermentPct', parseFloat(e.target.value)));
    inputs.prefermentHydration.addEventListener('input', (e) => updateState('prefermentHydration', parseFloat(e.target.value)));
    
    inputs.tempRoom.addEventListener('input', (e) => updateState('tempRoom', parseFloat(e.target.value)));
    inputs.tempFlour.addEventListener('input', (e) => updateState('tempFlour', parseFloat(e.target.value)));
    inputs.tempFriction.addEventListener('input', (e) => updateState('tempFriction', parseFloat(e.target.value)));
    inputs.tempTarget.addEventListener('input', (e) => updateState('tempTarget', parseFloat(e.target.value)));

    inputs.costFlour.addEventListener('input', (e) => updateState('costFlour', parseFloat(e.target.value)));
    inputs.costToppings.addEventListener('input', (e) => updateState('costToppings', parseFloat(e.target.value)));

    // Toggle Advanced
    toggleAdvancedBtn.addEventListener('click', () => {
        const isHidden = advancedSection.classList.contains('hidden');
        if (isHidden) {
            advancedSection.classList.remove('hidden');
            toggleAdvancedBtn.textContent = 'Hide Advanced Options ↑';
        } else {
            advancedSection.classList.add('hidden');
            toggleAdvancedBtn.textContent = 'Show Advanced Options (DDT, Preferments) ↓';
        }
    });
}

function syncInputPair(numberInput, rangeInput, stateKey) {
    numberInput.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        rangeInput.value = val;
        updateState(stateKey, val);
    });

    rangeInput.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        numberInput.value = val;
        updateState(stateKey, val);
    });
}

function updateState(key, value) {
    if (isNaN(value)) value = 0;
    state[key] = value;
    calculate();
}

function calculate() {
    // 1. Basic Dimensions
    const totalBatchWeight = state.quantity * state.weight;
    
    // 2. Baker's Percentages Logic
    // Total % = Flour (100) + All Ingredient %
    const totalPercentage = 100 + state.hydration + state.salt + state.yeast + state.oil + state.sugar;
    
    // Calculate Main Flour Weight first
    const mainFlourWeight = totalBatchWeight / (totalPercentage / 100);

    // Initial Ingredient Weights (Before Preferment)
    let weights = {
        flour: mainFlourWeight,
        water: mainFlourWeight * (state.hydration / 100),
        salt: mainFlourWeight * (state.salt / 100),
        yeast: mainFlourWeight * (state.yeast / 100),
        oil: mainFlourWeight * (state.oil / 100),
        sugar: mainFlourWeight * (state.sugar / 100)
    };

    // 3. Preferment Logic (Advanced)
    let prefermentDetails = null;
    if (state.prefermentPct > 0) {
        // Calculate amount of flour to pre-ferment
        const prefermentFlour = mainFlourWeight * (state.prefermentPct / 100);
        const prefermentWater = prefermentFlour * (state.prefermentHydration / 100);
        const prefermentTotal = prefermentFlour + prefermentWater;

        // Subtract from mains
        weights.flour -= prefermentFlour;
        weights.water -= prefermentWater;
        // Assume preferment contains no salt/oil/sugar/yeast for now (simple poolish/biga)

        prefermentDetails = {
            flour: prefermentFlour,
            water: prefermentWater,
            total: prefermentTotal
        };
    }

    // 4. DDT Calculation
    // Water Temp = (DDT * Factors) - (Room + Flour + Friction)
    // Factors = 3 (Room, Flour, Friction) + 1 (if Preferment used? usually simplified to just 3 or 4)
    // We'll use 3 factor for straight dough, 4 if preferment is significant, but let's keep it simple: 3 factors + Friction
    const multiplicationFactor = 3; 
    const totalTempFactor = state.tempTarget * multiplicationFactor;
    let requiredWaterTemp = totalTempFactor - state.tempRoom - state.tempFlour - state.tempFriction;
    
    // 5. Cost Calculation
    // Simple Estimate: Flour cost + "Toppings" (flat rate)
    // Real math: (FlourWeight_kg * FlourPrice) + (Quantity * ToppingsPrice) + (Yeast/Salt insignificant?)
    // This is a "quick estimate" as requested
    const flourCostTotal = (mainFlourWeight / 1000) * state.costFlour; // main flour only
    const toppingsCostTotal = state.quantity * state.costToppings;
    const totalCost = flourCostTotal + toppingsCostTotal; // Very rough, ignores salt/yeast cost
    const costPerBall = totalCost / state.quantity;

    // Render
    renderResults(weights, prefermentDetails, totalBatchWeight);
    renderDDT(requiredWaterTemp);
    renderCost(costPerBall);
}

function renderResults(weights, prefermentDetails, totalBatchWeight) {
    outputs.totalWeight.textContent = Math.round(totalBatchWeight);
    
    let html = '';

    // Main Flour
    html += createRow('Flour (Main)', weights.flour, 100 - (state.prefermentPct || 0));

    // Preferment Row
    if (prefermentDetails) {
        html += createRow('Preferment', prefermentDetails.total, null, 'accent');
        // Indented Breakdown
        html += `<tr class="sub-row"><td style="padding-left: 20px; font-size: 0.9em; opacity: 0.7;">↳ Flour</td><td>${Math.round(prefermentDetails.flour)}g</td><td></td></tr>`;
        html += `<tr class="sub-row"><td style="padding-left: 20px; font-size: 0.9em; opacity: 0.7;">↳ Water</td><td>${Math.round(prefermentDetails.water)}g</td><td></td></tr>`;
    }

    // Water
    html += createRow('Water', weights.water, state.hydration);
    
    // Other Ingredients
    html += createRow('Salt', weights.salt, state.salt);
    html += createRow('Yeast', weights.yeast, state.yeast);
    
    if (weights.oil > 0) html += createRow('Oil', weights.oil, state.oil);
    if (weights.sugar > 0) html += createRow('Sugar/Honey', weights.sugar, state.sugar);

    outputs.recipeBody.innerHTML = html;
}

function createRow(name, weight, pct, className = '') {
    const pctString = pct !== null ? `${pct.toFixed(1)}%` : '-';
    return `
        <tr class="${className}">
            <td>${name}</td>
            <td>${Math.round(weight)}g</td>
            <td>${pctString}</td>
        </tr>
    `;
}

function renderDDT(temp) {
    outputs.waterTempResult.textContent = Math.round(temp);
}

function renderCost(cost) {
    outputs.costPerBall.textContent = `$${cost.toFixed(2)}`;
}

// Run
init();
