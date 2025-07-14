const API_BASE_URL ='https://atamjon.robohouse.tech/api'


tailwind.config = {
    theme: {
        extend: {
            colors: {
                primary: '#10b981',
                secondary: '#059669',
                accent: '#34d399',
                dark: '#111827',
                'dark-light': '#1f2937',
                'dark-lighter': '#374151'
            }
        }
    }
}

function scrollToSection(sectionId) {
  document.getElementById(sectionId).scrollIntoView({ behavior: "smooth" })
}

function showNotification(message, type = "info") {
    const existingNotifications = document.querySelectorAll(".notification-toast")
    existingNotifications.forEach((notif) => notif.remove())
    const notification = document.createElement("div")
    notification.className = `notification-toast fixed top-20 right-4 z-50 p-4 rounded-2xl shadow-2xl max-w-sm transform transition-all duration-300 ${
      type === "success"
        ? "bg-green-600 text-white"
        : type === "error"
          ? "bg-red-600 text-white"
          : "bg-primary text-white"
    }`
    notification.innerHTML = `
          <div class="flex items-center">
              <i class="fas ${
                type === "success" ? "fa-check-circle" : type === "error" ? "fa-exclamation-circle" : "fa-info-circle"
              } mr-3"></i>
              <span class="flex-1">${message}</span>
              <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white/80 hover:text-white">
                  <i class="fas fa-times"></i>
              </button>
          </div>
      `
    document.body.appendChild(notification)
    setTimeout(() => {
      if (notification.parentElement) {
        notification.style.transform = "translateX(100%)"
        setTimeout(() => notification.remove(), 300)
      }
    }, 5000)
}


async function api(endpoint, options = {}) {
    const defaultOptions = {
      headers: {"Content-Type": "application/json"},
      credentials: "include",
    }
    const config = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers,
      },
    }
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config)
      if (response.status === 401) {
        window.location.href = "/"
        showNotification("Autentifikatsiya muvaffaqiyatsiz. Iltimos, qayta kiring.", "error")
      }
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || `HTTP xatosi! holat: ${response.status}`)
      }
      return data
    } catch (error) {
      console.error("API So'rov Xatosi:", error)
      throw error
    }
}

function renderNavbar(role, activePage) {
    const links = {
      user: [
        { href: "dashboard.html", icon: "fa-tachometer-alt", text: "Dashboard" },
        { href: "create-request.html", icon: "fa-plus-circle", text: "So'rov Yaratish" },
        { href: "profile.html", icon: "fa-user", text: "Profil" },
      ],
      manager: [
        { href: "dashboard.html", icon: "fa-tachometer-alt", text: "Dashboard" },
        { href: "staff.html", icon: "fa-users", text: "Xodimlar" },
        { href: "components.html", icon: "fa-cogs", text: "Komponentlar" },
        { href: "profile.html", icon: "fa-user", text: "Profil" },
      ],
      master: [
        { href: "dashboard.html", icon: "fa-tachometer-alt", text: "Dashboard" },
        { href: "components.html", icon: "fa-cogs", text: "Komponentlar" },
        { href: "profile.html", icon: "fa-user", text: "Profil" },
      ],
    }
  
    navLinks.innerHTML = links[role]
      .map(
        (link) => `
          <a href="${link.href}" class="nav-link flex items-center px-4 py-2 text-gray-300 hover:text-white rounded-lg transition-all ${activePage === link.href.split(".")[0] ? "active" : ""}">
              <i class="fas ${link.icon} mr-2"></i>
              <span>${link.text}</span>
          </a>
      `,
      )
      .join("")
}

async function initPage(page) {
  try {
    const user = await api("/auth/current-user")
    const role = user.role || "user"
    const userWelcome = document.getElementById("userWelcome")
    const userRole = document.getElementById("userRole")
    
    if (user?.isLegalEntity) {
      userRole.textContent = "Yuridik shaxs"
    }
    else {
      userRole.textContent = "Jismoniy shaxs"
    }
    
    if (userWelcome) {
      userWelcome.textContent = `Xush kelibsiz, ${user.firstName || ""} `.trim()
    }
    renderNavbar(role, page)
    return user
  } catch (error) {
    console.error("initPage xatosi:", error)
    throw error
  }
}


async function logout() {
  try {
    await api("/auth/logout", { method: "POST" })
    window.location.href = "index.html"
  } 
  catch (error) {
    showNotification("Chiqishda xatolik yuz berdi", "error")
  }
}

function formatDate(dateString) {
  if (!dateString) return "N/A"
  return new Date(dateString).toLocaleString("uz-UZ", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}


function getStatusColor(status) {
  switch (status?.toLowerCase()) {
    case "completed":
      return "bg-green-800 text-white"
    case "in_progress":
      return "bg-blue-800 text-white"
    case "pending":
      return "bg-yellow-800 text-white"
    default:
      return "bg-gray-800 text-white"
  }
}