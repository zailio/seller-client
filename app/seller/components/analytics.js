'use client';

import { useEffect, useRef, useState } from 'react';
import { FiTrendingUp, FiTrendingDown, FiShoppingCart, FiEye, FiDollarSign, FiPercent, FiRefreshCw } from 'react-icons/fi';
import Chart from 'chart.js/auto';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import styles from './css/analytics.module.css';
import Wait from '../../../components/wait';

import config from '../../../utils/config';


const ProductAnalytics = ({ auth, session }) => {
  const [visit, setVisit] = useState(false);
  const [car, setCar] = useState(false);
  const [convRate, setconvRate] = useState(false);
  const [totalVisit, setTotalVisit] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const eventSourceRef = useRef(null);
  const retryTimeoutRef = useRef(null);

  // Object to store all chart refs and instances
  const charts = useRef({
    visitsPurchases: { ref: null, instance: null },
    trafficSources: { ref: null, instance: null },
    conversionFunnel: { ref: null, instance: null },
    topProducts: { ref: null, instance: null },
    productPerformance: { ref: null, instance: null }
  });

  const connectToEventSource = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setIsLoading(true);
    setError(null);

    try {
      eventSourceRef.current = new EventSource(`${config.SERVER_URL}/seller/analytics?session_id=${session}&auth=${auth}`);

      eventSourceRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('Received data:', data);
      };

      eventSourceRef.current.onerror = (err) => {
        console.error('EventSource error:', err);
        setError('Connection error. Attempting to reconnect...');
        // scheduleRetry();
      };

      eventSourceRef.current.addEventListener('end', (event) => {
        const data = JSON.parse(event.data);
        console.log('Stream completed:', data);
        eventSourceRef.current?.close();
        setIsLoading(false);
      });

      eventSourceRef.current.addEventListener('response', (event) => {
        const data = JSON.parse(event.data);
        switch (data.event) {
          case 'visit':
            setVisit(data);
            break;
          case 'car':
            setCar(data);
            break;
          case 'convRate':
            setconvRate(data);
            break;
          case 'totalVisit':
            setTotalVisit(data);
            break;
          default:
            console.log('Unknown event type:', data.event);
        }
      });
    } catch (err) {
      console.error('Failed to create EventSource:', err);
      setError('Failed to connect. Attempting to reconnect...');
      scheduleRetry();
    }
  };

  const scheduleRetry = () => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }

    const delay = Math.min(1000 * Math.pow(2, retryCount), 30000); // Exponential backoff with max 30s
    setRetryCount(prev => prev + 1);

    retryTimeoutRef.current = setTimeout(() => {
      connectToEventSource();
    }, delay);
  };

  const handleRetry = () => {
    setRetryCount(0);
    connectToEventSource();
  };

  // Initialize connection when component mounts
  useEffect(() => {
    // Only connect if all states are false (no data received yet)
    if (!visit && !car && !convRate && !totalVisit) {
      connectToEventSource();
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // Initialize charts when component mounts or when data changes
  useEffect(() => {
    // Register plugins
    Chart.register(ChartDataLabels);

    // Destroy any existing charts before creating new ones
    Object.values(charts.current).forEach(chart => {
      if (chart.instance) {
        chart.instance.destroy();
      }
    });

    // Initialize each chart
    if (charts.current.visitsPurchases.ref) {
      charts.current.visitsPurchases.instance = new Chart(charts.current.visitsPurchases.ref, {
        type: 'line',
        data: {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          datasets: [
            {
              label: 'Visits',
              data: [1250, 1900, 1700, 2100, 2400, 1950, 1600],
              borderColor: '#3498db',
              backgroundColor: 'rgba(52, 152, 219, 0.1)',
              borderWidth: 2,
              tension: 0.3,
              fill: true
            },
            {
              label: 'Purchases',
              data: [120, 190, 150, 210, 240, 180, 150],
              borderColor: '#2ecc71',
              backgroundColor: 'rgba(46, 204, 113, 0.1)',
              borderWidth: 2,
              tension: 0.3,
              fill: true
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
            },
            tooltip: {
              mode: 'index',
              intersect: false,
            }
          },
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
    }

    if (charts.current.trafficSources.ref) {
      charts.current.trafficSources.instance = new Chart(charts.current.trafficSources.ref, {
        type: 'doughnut',
        data: {
          labels: ['Direct', 'Organic Search', 'Social Media', 'Email', 'Referral'],
          datasets: [{
            data: [25, 35, 20, 10, 10],
            backgroundColor: [
              '#3498db',
              '#2ecc71',
              '#9b59b6',
              '#f1c40f',
              '#e74c3c'
            ],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right',
            },
            datalabels: {
              formatter: (value) => {
                return value + '%';
              },
              color: '#fff',
              font: {
                weight: 'bold'
              }
            }
          }
        },
        plugins: [ChartDataLabels]
      });
    }

    if (charts.current.conversionFunnel.ref) {
      charts.current.conversionFunnel.instance = new Chart(charts.current.conversionFunnel.ref, {
        type: 'bar',
        data: {
          labels: ['Visits', 'Add to Cart', 'Initiate Checkout', 'Purchase'],
          datasets: [{
            label: 'Conversion Steps',
            data: [10000, 3500, 1500, 980],
            backgroundColor: [
              'rgba(52, 152, 219, 0.7)',
              'rgba(155, 89, 182, 0.7)',
              'rgba(241, 196, 15, 0.7)',
              'rgba(46, 204, 113, 0.7)'
            ],
            borderColor: [
              'rgba(52, 152, 219, 1)',
              'rgba(155, 89, 182, 1)',
              'rgba(241, 196, 15, 1)',
              'rgba(46, 204, 113, 1)'
            ],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: function (context) {
                  let label = context.dataset.label || '';
                  if (label) {
                    label += ': ';
                  }
                  label += context.raw.toLocaleString();
                  if (context.dataIndex > 0) {
                    const prevValue = context.dataset.data[context.dataIndex - 1];
                    const percentage = Math.round((context.raw / prevValue) * 100);
                    label += ` (${percentage}% conversion)`;
                  }
                  return label;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
    }

    if (charts.current.topProducts.ref) {
      charts.current.topProducts.instance = new Chart(charts.current.topProducts.ref, {
        type: 'bar',
        data: {
          labels: ['Headphones', 'Fitness Tracker', 'T-Shirt', 'Water Bottle', 'Phone Charger'],
          datasets: [{
            label: 'Revenue',
            data: [28450, 19600, 9350, 7800, 2250],
            backgroundColor: 'rgba(52, 152, 219, 0.7)',
            borderColor: 'rgba(52, 152, 219, 1)',
            borderWidth: 1
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: function (context) {
                  return '$' + context.raw.toLocaleString();
                }
              }
            }
          },
          scales: {
            x: {
              beginAtZero: true,
              ticks: {
                callback: function (value) {
                  return '$' + value.toLocaleString();
                }
              }
            }
          }
        }
      });
    }

    if (charts.current.productPerformance.ref) {
      charts.current.productPerformance.instance = new Chart(charts.current.productPerformance.ref, {
        type: 'radar',
        data: {
          labels: ['Visits', 'Purchases', 'Conversion', 'Revenue', 'Rating', 'Returns'],
          datasets: [
            {
              label: 'Premium Headphones',
              data: [95, 90, 88, 95, 92, 85],
              backgroundColor: 'rgba(52, 152, 219, 0.2)',
              borderColor: 'rgba(52, 152, 219, 1)',
              borderWidth: 2,
              pointBackgroundColor: 'rgba(52, 152, 219, 1)'
            },
            {
              label: 'Fitness Tracker',
              data: [85, 80, 82, 78, 88, 90],
              backgroundColor: 'rgba(46, 204, 113, 0.2)',
              borderColor: 'rgba(46, 204, 113, 1)',
              borderWidth: 2,
              pointBackgroundColor: 'rgba(46, 204, 113, 1)'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
            },
            tooltip: {
              callbacks: {
                label: function (context) {
                  return context.dataset.label + ': ' + context.raw + '%';
                }
              }
            }
          },
          scales: {
            r: {
              angleLines: {
                display: true
              },
              suggestedMin: 0,
              suggestedMax: 100,
              ticks: {
                stepSize: 20,
                callback: function (value) {
                  return value + '%';
                }
              }
            }
          }
        }
      });
    }

    // Cleanup function
    return () => {
      // Destroy all chart instances
      Object.values(charts.current).forEach(chart => {
        if (chart.instance) {
          chart.instance.destroy();
        }
      });
      Chart.unregister(ChartDataLabels);
    };
  }, [visit, car, convRate, totalVisit]);

  const selection = {
    'week': 'Last 7 Days',
    'month': 'Last Month',
    'year': 'Last Year',
    'overall': 'Full Data'
  };
  const [selectedPeriods, setSelectedPeriods] = useState({
    visitsPurchases: 'week',
    trafficSources: 'week',
    conversionFunnel: 'week',
    topProducts: 'week',
    productPerformance: 'week'
  });
  const handlePeriodChange = (chartName, period) => {
    // Update the selected period for the specific chart
    setSelectedPeriods(prev => ({
      ...prev,
      [chartName]: period
    }));

    // Make API request with the new period
    // fetchChartData(chartName, period);
  };
  return (
    <div className={styles.an}>
      {/* Stats Cards */}
      <div className={styles.statsContainer}>
        <div className={styles.statCard}>
          {visit ? (
            <div>
              <h3 className={styles.statTitle}>
                <FiEye className="icon" /> Total Site Visits
              </h3>
              <div className={styles.statValue}>{visit.value}</div>
              <div className={styles.statDescription}>
                All-time visitor count
              </div>
            </div>
          ) : (
            <Wait />
          )}
        </div>

        <div className={styles.statCard}>
          {car ? (
            <div>
              <h3 className={styles.statTitle}>
                <FiShoppingCart className="icon" /> Cart Abandonment Rate
              </h3>
              <div className={styles.statValue}>{car.total}</div>
              <div className={`${styles.statChange} ${car.trend ? styles.positive : styles.negative}`}>
                {car.trend ? <FiTrendingUp /> : <FiTrendingDown />}
                {car.percentage}% from last month
              </div>
            </div>
          ) : (
            <Wait />
          )}
        </div>

        <div className={styles.statCard}>
          {convRate ? (
            <div>
              <h3 className={styles.statTitle}>
                <FiPercent className="icon" /> Conversion Rate
              </h3>
              <div className={styles.statValue}>{convRate.percentage}%</div>
              <div className={styles.statChange}>
                {convRate.total} item sold
              </div>
            </div>
          ) : (
            <Wait />
          )}
        </div>

        <div className={styles.statCard}>
          {totalVisit ? (
            <div>
              <h3 className={styles.statTitle}>
                <FiEye className="icon" /> Total Product Visits
              </h3>
              <div className={styles.statValue}>{totalVisit.value}</div>
              <div className={styles.statDescription}>
                All-time visitor count
              </div>
            </div>
          ) : (
            <Wait />
          )}
        </div>
      </div>

      {/* Charts Grid */}
      <div className={styles.chartGrid}>
        <div className={styles.container}>
          <div className={styles.header}>
            <h2 className={styles.title}>Visits vs Purchases ({selection[selectedPeriods.visitsPurchases]})</h2>
          </div>
          <div className={styles.selection}>
            {Object.entries(selection).map(([key, value]) => (
              <span
                key={`visitsPurchases-${key}`}
                className={selectedPeriods.visitsPurchases === key ? styles.active : ''}
                onClick={() => handlePeriodChange('visitsPurchases', key)}
              >
                {key}
              </span>
            ))}
          </div>
          <div className={styles.chartWrapper}>
            <canvas ref={el => charts.current.visitsPurchases.ref = el} />
          </div>
        </div>

        <div className={styles.container}>
          <div className={styles.header}>
            <h2 className={styles.title}>Traffic Sources</h2>
          </div>
          <div className={styles.selection}>
            {Object.entries(selection).map(([key, value]) => (
              <span
                key={`trafficSources-${key}`}
                className={selectedPeriods.trafficSources === key ? styles.active : ''}
                onClick={() => handlePeriodChange('trafficSources', key)}
              >
                {key}
              </span>
            ))}
          </div>
          <div className={styles.chartWrapper}>
            <canvas ref={el => charts.current.trafficSources.ref = el} />
          </div>
        </div>

        <div className={styles.container}>
          <div className={styles.header}>
            <h2 className={styles.title}>Conversion Funnel</h2>
          </div>
          <div className={styles.selection}>
            {Object.entries(selection).map(([key, value]) => (
              <span
                key={`conversionFunnel-${key}`}
                className={selectedPeriods.conversionFunnel === key ? styles.active : ''}
                onClick={() => handlePeriodChange('conversionFunnel', key)}
              >
                {key}
              </span>
            ))}
          </div>
          <div className={styles.chartWrapper}>
            <canvas ref={el => charts.current.conversionFunnel.ref = el} />
          </div>
        </div>

        <div className={styles.container}>
          <div className={styles.header}>
            <h2 className={styles.title}>Top Products by Revenue</h2>
          </div>
          <div className={styles.selection}>
            {Object.entries(selection).map(([key, value]) => (
              <span
                key={`topProducts-${key}`}
                className={selectedPeriods.topProducts === key ? styles.active : ''}
                onClick={() => handlePeriodChange('topProducts', key)}
              >
                {key}
              </span>
            ))}
          </div>
          <div className={styles.chartWrapper}>
            <canvas ref={el => charts.current.topProducts.ref = el} />
          </div>
        </div>
      </div>

      {/* Full Width Chart */}
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>Product Performance Comparison</h2>
        </div>
        <div className={styles.selection}>
          {Object.entries(selection).map(([key, value]) => (
            <span
            key={`productPerformance-${key}`}
            className={selectedPeriods.productPerformance === key ? styles.active : ''}
            onClick={() => handlePeriodChange('productPerformance', key)}
          >
            {key}
          </span>
          ))}
        </div>
        <div className={styles.chartWrapper}>
          <canvas ref={el => charts.current.productPerformance.ref = el} />
        </div>
      </div>
    </div>
  );
};

export default ProductAnalytics;