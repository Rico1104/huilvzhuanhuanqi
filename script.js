// API配置
const API_KEY = 'YOUR_API_KEY'; // 需要替换为实际的API密钥
const API_BASE_URL = 'https://v6.exchangerate-api.com/v6';

// DOM元素
const elements = {
    amount: document.getElementById('amount'),
    fromCurrency: document.getElementById('from-currency'),
    toCurrency: document.getElementById('to-currency'),
    swapButton: document.getElementById('swap-button'),
    convertButton: document.getElementById('convert-button'),
    convertedAmount: document.getElementById('converted-amount'),
    rate: document.getElementById('rate'),
    currentTime: document.getElementById('current-time'),
    rateUpdateTime: document.getElementById('rate-update-time'),
    chartCurrency: document.getElementById('chart-currency'),
    chartPeriod: document.getElementById('chart-period'),
    chartInterval: document.getElementById('chart-interval'),
    rateTableBody: document.getElementById('rate-table-body')
};

// 图表实例
let rateChart = null;

// 货币配置
const currencies = {
    'CNY': '人民币',
    'USD': '美元',
    'EUR': '欧元',
    'JPY': '日元',
    'GBP': '英镑',
    'AUD': '澳元',
    'CAD': '加元',
    'HKD': '港币',
    'SGD': '新加坡元',
    'CHF': '瑞士法郎',
    'NZD': '新西兰元',
    'KRW': '韩元',
    'RUB': '俄罗斯卢布',
    'INR': '印度卢比',
    'BRL': '巴西雷亚尔',
    'ZAR': '南非兰特',
    'MXN': '墨西哥比索',
    'TRY': '土耳其里拉',
    'SAR': '沙特里亚尔',
    'AED': '阿联酋迪拉姆'
};

// 初始化应用
async function initializeApp() {
    // 设置默认值
    elements.amount.value = '100';
    
    // 添加事件监听器
    elements.swapButton.addEventListener('click', swapCurrencies);
    elements.convertButton.addEventListener('click', convertCurrency);
    elements.amount.addEventListener('input', handleAmountInput);
    elements.fromCurrency.addEventListener('change', handleCurrencyChange);
    elements.toCurrency.addEventListener('change', handleCurrencyChange);
    elements.chartCurrency.addEventListener('change', updateChart);
    elements.chartPeriod.addEventListener('change', updateChart);
    elements.chartInterval.addEventListener('change', updateChart);

    // 初始化时间显示
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);

    // 初始化汇率数据
    await updateExchangeRates();
    setInterval(updateExchangeRates, 60000); // 每分钟更新一次

    // 初始化图表
    initializeChart();
    
    // 添加移动端触摸支持
    addTouchSupport();
}

// 处理金额输入
function handleAmountInput(e) {
    const value = e.target.value;
    if (value && !isNaN(value)) {
        convertCurrency();
    }
}

// 处理货币变化
async function handleCurrencyChange() {
    await updateExchangeRates();
    convertCurrency();
}

// 交换货币
async function swapCurrencies() {
    const temp = elements.fromCurrency.value;
    elements.fromCurrency.value = elements.toCurrency.value;
    elements.toCurrency.value = temp;
    await updateExchangeRates();
    convertCurrency();
}

// 更新当前时间
function updateCurrentTime() {
    const now = new Date();
    elements.currentTime.textContent = `当前时间：${now.toLocaleString('zh-CN')}`;
}

// 错误处理优化
function showError(message) {
    const existingError = document.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }

    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);

    // 3秒后自动移除
    setTimeout(() => {
        errorDiv.style.opacity = '0';
        setTimeout(() => errorDiv.remove(), 300);
    }, 3000);
}

// 加载状态处理优化
function showLoading() {
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading';
    document.body.appendChild(loadingDiv);
    return loadingDiv;
}

function hideLoading(loadingElement) {
    if (loadingElement) {
        loadingElement.style.opacity = '0';
        setTimeout(() => loadingElement.remove(), 300);
    }
}

// 获取汇率数据优化
async function getExchangeRates(base) {
    const loading = showLoading();
    try {
        const response = await axios.get(`${API_BASE_URL}/${API_KEY}/latest/${base}`);
        hideLoading(loading);
        return response.data;
    } catch (error) {
        hideLoading(loading);
        console.error('获取汇率数据失败:', error);
        showError('获取汇率数据失败，请检查网络连接后重试');
        return null;
    }
}

// 更新汇率
async function updateExchangeRates() {
    const data = await getExchangeRates(elements.fromCurrency.value);
    if (data) {
        const rate = data.conversion_rates[elements.toCurrency.value];
        elements.rate.textContent = rate.toFixed(4);
        elements.rateUpdateTime.textContent = `更新时间：${new Date(data.time_last_update_utc).toLocaleString('zh-CN')}`;
        updateRateTable(data.conversion_rates);
    }
}

// 转换货币
function convertCurrency() {
    const amount = parseFloat(elements.amount.value);
    const rate = parseFloat(elements.rate.textContent);
    
    if (!isNaN(amount) && !isNaN(rate)) {
        const result = (amount * rate).toFixed(2);
        elements.convertedAmount.textContent = `${result} ${elements.toCurrency.value}`;
    }
}

// 初始化图表优化
function initializeChart() {
    const ctx = document.getElementById('rateChart').getContext('2d');
    
    // 检查是否在移动设备上
    const isMobile = window.innerWidth <= 768;
    
    rateChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: '汇率走势',
                data: [],
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                borderWidth: isMobile ? 1.5 : 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            return `汇率: ${context.parsed.y.toFixed(4)}`;
                        }
                    },
                    padding: isMobile ? 8 : 12,
                    titleFont: {
                        size: isMobile ? 12 : 14
                    },
                    bodyFont: {
                        size: iMobile ? 11 : 13
                    }
                },
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: {
                        callback: function(value) {
                            return value.toFixed(4);
                        },
                        font: {
                            size: isMobile ? 10 : 12
                        }
                    },
                    grid: {
                        color: 'rgba(102, 126, 234, 0.1)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        maxRotation: isMobile ? 45 : 0,
                        font: {
                            size: iMobile ? 10 : 12
                        }
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

// 更新图表数据优化
async function updateChart() {
    const currency = elements.chartCurrency.value;
    const period = elements.chartPeriod.value;
    const interval = elements.chartInterval.value;
    const loading = showLoading();

    try {
        const response = await axios.get(
            `${API_BASE_URL}/${API_KEY}/history/CNY/${period}/${currency}`
        );

        const data = response.data;
        if (!data || !data.rates) {
            throw new Error('无效的数据格式');
        }

        const rates = data.rates;
        const dates = Object.keys(rates).sort();
        const values = dates.map(date => rates[date][currency]);

        // 根据选择的时间间隔处理数据
        const processedData = processChartData(dates, values, interval);

        // 更新图表配置
        rateChart.data.labels = processedData.dates;
        rateChart.data.datasets[0].data = processedData.values;
        
        // 优化Y轴显示
        const minValue = Math.min(...processedData.values);
        const maxValue = Math.max(...processedData.values);
        const padding = (maxValue - minValue) * 0.1;
        
        rateChart.options.scales.y.min = minValue - padding;
        rateChart.options.scales.y.max = maxValue + padding;
        
        rateChart.update();
        hideLoading(loading);
    } catch (error) {
        hideLoading(loading);
        console.error('获取历史数据失败:', error);
        showError('获取历史数据失败，请稍后重试');
    }
}

// 处理图表数据
function processChartData(dates, values, interval) {
    if (interval === 'day') {
        return { dates, values };
    }

    const processed = {
        dates: [],
        values: []
    };

    let currentSum = 0;
    let count = 0;
    let currentPeriod = '';

    dates.forEach((date, index) => {
        const d = new Date(date);
        const periodKey = interval === 'week' 
            ? `${d.getFullYear()}-W${Math.floor(d.getDate() / 7)}`
            : `${d.getFullYear()}-${d.getMonth() + 1}`;

        if (currentPeriod === '') {
            currentPeriod = periodKey;
        }

        if (currentPeriod === periodKey) {
            currentSum += values[index];
            count++;
        } else {
            processed.dates.push(dates[index - 1]);
            processed.values.push(currentSum / count);
            currentSum = values[index];
            count = 1;
            currentPeriod = periodKey;
        }
    });

    // 添加最后一组数据
    if (count > 0) {
        processed.dates.push(dates[dates.length - 1]);
        processed.values.push(currentSum / count);
    }

    return processed;
}

// 更新汇率表格优化
function updateRateTable(rates) {
    if (!rates) return;

    const mainCurrencies = ['USD', 'EUR', 'JPY', 'GBP', 'AUD', 'CAD', 'HKD', 'SGD'];
    let tableHTML = '';

    try {
        mainCurrencies.forEach(currency => {
            if (currency !== elements.fromCurrency.value) {
                const rate = rates[currency];
                if (typeof rate !== 'number') return;

                const change = ((rate - rate * 0.98) / (rate * 0.98) * 100).toFixed(2);
                const changeClass = change >= 0 ? 'rate-change-up' : 'rate-change-down';
                const buyRate = (rate * 0.98).toFixed(4);
                const sellRate = (rate * 1.02).toFixed(4);
                
                tableHTML += `
                    <tr>
                        <td>${currency}</td>
                        <td><span class="rate-value buy">${buyRate}</span></td>
                        <td><span class="rate-value sell">${sellRate}</span></td>
                        <td><span class="rate-value middle">${rate.toFixed(4)}</span></td>
                        <td><span class="${changeClass}">${change}%</span></td>
                    </tr>
                `;
            }
        });

        elements.rateTableBody.innerHTML = tableHTML;
    } catch (error) {
        console.error('更新汇率表格失败:', error);
        showError('更新汇率表格失败，请刷新页面重试');
    }
}

// 添加移动端触摸支持
function addTouchSupport() {
    let startX = 0;
    let startY = 0;
    
    document.addEventListener('touchstart', e => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
    }, false);
    
    document.addEventListener('touchmove', e => {
        if (!startX || !startY) return;
        
        const diffX = startX - e.touches[0].clientX;
        const diffY = startY - e.touches[0].clientY;
        
        // 如果水平滑动大于垂直滑动，阻止默认行为（防止页面左右滑动）
        if (Math.abs(diffX) > Math.abs(diffY)) {
            e.preventDefault();
        }
    }, { passive: false });
}

// 启动应用
document.addEventListener('DOMContentLoaded', initializeApp); 