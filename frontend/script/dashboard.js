document.addEventListener("DOMContentLoaded", async () => {
  try {
    const user = await initPage("dashboard")
    await displayRequests(user)
    let stats = { total_requests: 0, pending_requests: 0, in_progress_requests: 0, completed_requests: 0 }
    try {
      stats = await api("/stats/requests")
    } catch (error) {
      console.log("Request stats fetch failed:", error)
      showNotification("So'rov statistikasi yuklanmadi", "error")
    }
    await displayDashboard(user, stats)
  } catch (error) {
    console.log(error)
    showNotification("Sahifa yuklashda xatolik", "error")
  }
})

async function displayDashboard(user, stats) {
  const dashboardContent = document.getElementById("dashboardContent")
  const chartContainer = document.getElementById("chartContainer")
  
  dashboardContent.innerHTML = `
      <div class="glass-card rounded-xl p-6 glass-effect hover-glow">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-semibold text-white">Jami So'rovlar</h3>
            <p class="text-3xl font-bold text-white mt-2">${stats.total_requests || 0}</p>
          </div>
          <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <i class="fas fa-clipboard-list text-white text-xl"></i>
          </div>
        </div>
      </div>
      <div class="glass-card rounded-xl p-6 glass-effect hover-glow">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-semibold text-white">Kutilmoqda</h3>
            <p class="text-3xl font-bold text-yellow-400 mt-2">${stats.pending_requests || 0}</p>
          </div>
          <div class="w-12 h-12 bg-yellow-600/20 rounded-xl flex items-center justify-center">
            <i class="fas fa-hourglass-half text-yellow-400 text-xl"></i>
          </div>
        </div>
      </div>
      <div class="glass-card rounded-xl p-6 glass-effect hover-glow">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-semibold text-white">Jarayonda</h3>
            <p class="text-3xl font-bold text-blue-400 mt-2">${stats.in_progress_requests || 0}</p>
          </div>
          <div class="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center">
            <i class="fas fa-cogs text-blue-400 text-xl"></i>
          </div>
        </div>
      </div>
      <div class="glass-card rounded-xl p-6 glass-effect hover-glow">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-semibold text-white">Yakunlangan</h3>
            <p class="text-3xl font-bold text-green-400 mt-2">${stats.completed_requests || 0}</p>
          </div>
          <div class="w-12 h-12 bg-green-600/20 rounded-xl flex items-center justify-center">
            <i class="fas fa-check-circle text-green-400 text-xl"></i>
          </div>
        </div>
      </div>
    `

  console.log(user.role)
  if (user.role === "manager") {
    try {
      const [locations, registrations, serviceRequests] = await Promise.all([
        api("/stats/locations"),
        api("/stats/visitors"),
        api("/service-request")
      ])

      const registrationData = registrations
      const locationData = locations

      const issueTypeData = Object.values(
        serviceRequests.reduce((acc, issue) => {
          const key = issue.issue_type || "Noma'lum";
          if (!acc[key]) {
            acc[key] = { issue_type: key, count: 0 };
          }
          acc[key].count += 1;
          return acc;
        }, {})
      );

      chartContainer.innerHTML = `
          <!-- Issue Types Pie Chart -->
          <div class="glass-card rounded-2xl p-6 hover-glow">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-xl font-bold text-white flex items-center gap-3">
                <div class="w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full pulse-animation"></div>
                Muammo Turlari
              </h3>
              <div class="text-white/60">
                <i class="fas fa-chart-pie text-lg"></i>
              </div>
            </div>
            <div class="chart-container" style="position: relative; height: 350px; width: 100%;">
              <canvas id="issueTypesChart"></canvas>
            </div>
          </div>

          <!-- Locations Chart -->
          <div class="glass-card rounded-2xl p-6 hover-glow">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-xl font-bold text-white flex items-center gap-3">
                <div class="w-3 h-3 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full pulse-animation"></div>
                Tashrif Joylari
              </h3>
              <div class="text-white/60">
                <i class="fas fa-map-marker-alt text-lg"></i>
              </div>
            </div>
            <div class="chart-container" style="position: relative; height: 350px; width: 100%;">
              <canvas id="visitorChart"></canvas>
            </div>
          </div>

          <!-- Registrations Chart -->
          <div class="glass-card rounded-2xl p-6 hover-glow" style="grid-column: 1 / -1;">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-xl font-bold text-white flex items-center gap-3">
                <div class="w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full pulse-animation"></div>
                Ro'yxatdan O'tganlar
              </h3>
              <div class="text-white/60">
                <i class="fas fa-chart-line text-lg"></i>
              </div>
            </div>
            <div class="chart-container" style="position: relative; height: 350px; width: 100%;">
              <canvas id="registrationChart"></canvas>
            </div>
          </div>
        `

      const issueTypesCtx = document.getElementById("issueTypesChart").getContext('2d')
      new Chart(issueTypesCtx, {
        type: "doughnut",
        data: {
          labels: issueTypeData.map(item => item.issue_type),
          datasets: [{
            data: issueTypeData.map(item => item.count),
            backgroundColor: ['#f59e0b','#10b981', '#3b82f6','#8b5cf6','#ef4444'],
            borderColor: 'rgba(255, 255, 255, 0.2)',
            borderWidth: 2,
            hoverBorderWidth: 3,
            hoverBorderColor: '#ffffff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                color: '#e5e7eb',
                padding: 20,
                usePointStyle: true,
                font: {
                  size: 12
                }
              }
            },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              titleColor: '#ffffff',
              bodyColor: '#e5e7eb',
              borderColor: 'rgba(255, 255, 255, 0.2)',
              borderWidth: 1
            }
          },
          cutout: '60%'
        }
      })

      // Registration Line Chart
      new Chart(document.getElementById("registrationChart"), {
        type: "line",
        data: {
          labels: registrationData.map((d) => d.date),
          datasets: [
            {
              label: "Ro'yxatdan O'tganlar",
              data: registrationData.map((d) => d.count),
              borderColor: "#3b82f6",
              backgroundColor: "rgba(59, 130, 246, 0.1)",
              borderWidth: 3,
              fill: true,
              tension: 0.4,
              pointBackgroundColor: "#3b82f6",
              pointBorderColor: "#ffffff",
              pointBorderWidth: 2,
              pointRadius: 6,
              pointHoverRadius: 8
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { 
              mode: "index", 
              intersect: false,
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              titleColor: '#ffffff',
              bodyColor: '#e5e7eb',
              borderColor: 'rgba(255, 255, 255, 0.2)',
              borderWidth: 1
            },
          },
          scales: {
            x: {
              ticks: {
                color: '#e5e7eb',
                font: {
                  size: 11
                }
              },
              grid: {
                color: 'rgba(255, 255, 255, 0.1)'
              }
            },
            y: {
              ticks: {
                color: '#e5e7eb',
                font: {
                  size: 11
                }
              },
              grid: {
                color: 'rgba(255, 255, 255, 0.1)'
              },
              beginAtZero: true
            },
          },
        },
      })

      // Visitor Bar Chart
      new Chart(document.getElementById("visitorChart"), {
        type: "bar",
        data: {
          labels: locationData.map((d) => d.source),
          datasets: [
            {
              label: "Murojatlar",
              data: locationData.map((d) => d.count),
              backgroundColor: 'rgba(16, 185, 129, 0.8)',
              borderColor: '#10b981',
              borderWidth: 2,
              borderRadius: 8,
              borderSkipped: false
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { 
              mode: "index", 
              intersect: false,
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              titleColor: '#ffffff',
              bodyColor: '#e5e7eb',
              borderColor: 'rgba(255, 255, 255, 0.2)',
              borderWidth: 1
            },
          },
          scales: {
            x: {
              ticks: {
                color: '#e5e7eb',
                font: {
                  size: 11
                }
              },
              grid: {
                color: 'rgba(255, 255, 255, 0.1)'
              }
            },
            y: {
              ticks: {
                color: '#e5e7eb',
                font: {
                  size: 11
                }
              },
              grid: {
                color: 'rgba(255, 255, 255, 0.1)'
              },
              beginAtZero: true
            },
          },
        },
      })

    } catch (error) {
      console.log(error)
      showNotification("Statistika yuklanmadi", "error")
      chartContainer.innerHTML = ""
    }
  } else {
    chartContainer.innerHTML = ""
  }
}