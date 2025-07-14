let selectedComponents = []

function getStatusColor(status) {
  switch (status) {
    case "approved":
      return "bg-green-600"
    case "pending":
      return "bg-yellow-600"
    case "in_progress":
      return "bg-blue-600"
    case "in_review":
      return "bg-orange-600"
    case "completed":
      return "bg-green-600"
    default:
      return "bg-gray-600"
  }
}

function formatDate(date) {
  return new Date(date).toLocaleDateString()
}

async function displayRequests(user) {
  const requestsList = document.getElementById("requestsList")
  if (!requestsList) {
    showNotification("So'rovlar ro'yxati topilmadi", "error")
    return
  }
  try {
    const requests = await api("/service-request")

    if (requests.length === 0) {
      requestsList.innerHTML = `
        <div class="text-center py-12">
            <div class="w-20 h-20 bg-black/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <i class="fas fa-inbox text-white/60 text-3xl"></i>
            </div>
            <h3 class="text-xl font-bold text-white mb-2">So'rovlar Topilmadi</h3>
            <p class="text-white/70 mb-6">${user.role === "user" ? "Siz hali hech qanday xizmat so'rovini yubormadingiz." : "Hali hech qanday so'rov yo'q."}</p>
            ${
              user.role === "user"
                ? `
                <a href="create-request.html" class="bg-white/20 text-white px-6 py-3 rounded-xl font-medium hover:bg-white/30 transition-all">
                    Birinchi So'rovni Yaratish
                </a>
            `
                : ""
            }
        </div>
      `
      return
    }

    
    requestsList.innerHTML = `
      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="text-white/80 border-b border-white/20">
              <th class="p-4 font-semibold">Uskuna</th>
              ${user.role !== "user" ? '<th class="p-4 font-semibold">Mijoz</th>' : ""}
              <th class="p-4 font-semibold ">Muammo</th>
              <th class="p-4 font-semibold">Manzil</th>
              <th class="p-4 font-semibold">Holat</th>
              <th class="p-4 font-semibold">Sana</th>
              <th class="p-4 font-semibold">Amallar</th>
            </tr>
          </thead>
          <tbody>
            ${requests
              .map(
                (request) => `
              <tr class="border-b border-white/10 hover:bg-white/5 transition-all">
                <td class="p-4">
                  <div>
                    <div class="whitespace-nowrap text-white font-medium">${request.device_model || "Noma'lum Uskuna"}</div>
                    <div class="text-white/60 text-sm">${request.issue_type || "Turi ko'rsatilmagan"}</div>
                  </div>
                </td>
                ${
                  user.role !== "user"
                    ? `
                  <td class="p-4">
                    <div>
                      <div class="text-white font-medium">${request.owner?.firstname || "Noma'lum"} ${request.owner?.lastname || ""}</div>
                      <div class="text-white/60 text-sm">${request.owner?.email || ""}</div>
                    </div>
                  </td>
                `
                    : ""
                }
                <td class="p-4">
                  <div class="text-white/80 text-sm max-w-xs truncate" title="${request.description || "Tavsif yo'q"}">
                    ${request.description || "Tavsif yo'q"}
                  </div>
                  ${request.problem_area ? `<div class="text-white/60 text-xs mt-1">${request.problem_area}</div>` : ""}
                </td>
                <td class="p-4">
                  <span class="text-white/80">${request.location || "Ko'rsatilmagan"}</span>
                </td>
                <td class="p-4">
                  <span class="px-3 py-1 text-xs font-semibold uppercase rounded-lg text-white ${getStatusColor(request.status)}">
                    ${request.status || "Kutilmoqda"}
                  </span>
                </td>
                <td class="p-4">
                  <span class="text-white/80 text-sm">${formatDate(request.createdAt)}</span>
                </td>
                <td class="p-4">
                  <div class="flex items-center space-x-2">
                    ${getActionButtons(user, request)}
                  </div>
                </td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `
  } catch (error) {
    showNotification("So'rovlar yuklanmadi", "error")
    requestsList.innerHTML = `
      <div class="text-center py-12">
          <div class="w-20 h-20 bg-black/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <i class="fas fa-exclamation-circle text-white/60 text-3xl"></i>
          </div>
          <h3 class="text-xl font-bold text-white mb-2">Xatolik</h3>
          <p class="text-white/70">Iltimos, keyinroq urinib ko'ring.</p>
      </div>
    `
  }
}

function getActionButtons(user, request) {
  if (user.role === "user" && request.status === "approved") {
    return `
      <button onclick="showAcknowledgeModal('${request._id}')" class="bg-green-600/20 text-green-400 px-3 py-1 rounded-lg text-xs hover:bg-green-600/30 transition-all flex items-center gap-1">
          <i class="fas fa-check"></i> Tasdiqlash
      </button>
    `
  } else if (user.role === "manager" && request.status === "pending") {
    return `
      <button onclick="showDetailModal('${request._id}')" class="bg-primary/20 text-primary px-3 py-1 rounded-lg text-xs hover:bg-primary/30 transition-all flex items-center gap-1">
          <i class="fas fa-eye"></i> Ko'rish
      </button>
    `
  } else if (user.role === "master" && request.status === "in_progress") {
    return `
      <button onclick="markAsComplete('${request._id}')" class="bg-blue-600/20 text-blue-400 px-3 py-1 rounded-lg text-xs hover:bg-blue-600/30 transition-all flex items-center gap-1">
          <i class="fas fa-tools"></i> Yakunlash
      </button>
    `
  } else if (user.role === "master" && request.status === "in_review") {
    return `
      <button onclick="showUpdateModal('${request._id}')" class="bg-yellow-600/20 text-yellow-400 px-3 py-1 rounded-lg text-xs hover:bg-yellow-600/30 transition-all flex items-center gap-1">
          <i class="fas fa-edit"></i> Yangilash
      </button>
    `
  }
  return `<span class="text-white/40 text-xs">-</span>`
}

async function showDetailModal(requestId) {
  const modalContainer = document.getElementById("modalContainer")
  if (!modalContainer) {
    showNotification("Modal topilmadi", "error")
    return
  }
  try {
    const requests = await api("/service-request")
    const request = requests.find((r) => r._id === requestId)
    if (!request) {
      showNotification("So'rov topilmadi", "error")
      modalContainer.innerHTML = ""
      return
    }
    modalContainer.innerHTML = `
      <div class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div class="glass-card rounded-2xl p-6 w-full max-w-lg shadow-2xl border border-white/20">
              <div class="flex justify-between items-center mb-6">
                  <h2 class="text-xl font-bold text-white flex items-center gap-2">
                      <i class="fas fa-info-circle text-primary"></i>
                      So'rov Tafsilotlari
                  </h2>
                  <button onclick="document.getElementById('modalContainer').innerHTML = ''" 
                          class="text-white/60 hover:text-white text-xl hover:bg-black/20 rounded-lg p-2 transition-all">
                      <i class="fas fa-times"></i>
                  </button>
              </div>
              
              <div class="space-y-4">
                  <!-- Device Info -->
                  <div class="bg-white/5 rounded-xl p-4 border border-white/10">
                      <h3 class="text-sm font-semibold text-white/80 mb-3 flex items-center gap-2">
                          <i class="fas fa-laptop text-primary text-sm"></i>
                          Uskuna Ma'lumotlari
                      </h3>
                      <div class="space-y-2 text-sm">
                          <div class="flex justify-between">
                              <span class="text-white/60">Model:</span>
                              <span class="text-white font-medium">${request.device_model || "Ko'rsatilmagan"}</span>
                          </div>
                          <div class="flex justify-between">
                              <span class="text-white/60">Muammo:</span>
                              <span class="text-white font-medium">${request.issue_type || "Ko'rsatilmagan"}</span>
                          </div>
                          <div class="flex justify-between">
                              <span class="text-white/60">Joyi:</span>
                              <span class="text-white font-medium">${request.problem_area || "Ko'rsatilmagan"}</span>
                          </div>
                      </div>
                  </div>

                  <!-- User Info -->
                  <div class="bg-white/5 rounded-xl p-4 border border-white/10">
                      <h3 class="text-sm font-semibold text-white/80 mb-3 flex items-center gap-2">
                          <i class="fas fa-user text-primary text-sm"></i>
                          Foydalanuvchi
                      </h3>
                      <div class="space-y-2 text-sm">
                          <div class="flex justify-between">
                              <span class="text-white/60">Ism:</span>
                              <span class="text-white font-medium">${request.owner?.firstname || "Ko'rsatilmagan"}</span>
                          </div>
                          <div class="flex justify-between">
                              <span class="text-white/60">Familiya:</span>
                              <span class="text-white font-medium">${request.owner?.lastname || "Ko'rsatilmagan"}</span>
                          </div>
                      </div>
                  </div>

                  <!-- Status Info -->
                  <div class="bg-white/5 rounded-xl p-4 border border-white/10">
                      <h3 class="text-sm font-semibold text-white/80 mb-3 flex items-center gap-2">
                          <i class="fas fa-clock text-primary text-sm"></i>
                          Holat Ma'lumotlari
                      </h3>
                      <div class="space-y-2 text-sm">
                          <div class="flex justify-between">
                              <span class="text-white/60">Sana:</span>
                              <span class="text-white font-medium">${formatDate(request.createdAt)}</span>
                          </div>
                          <div class="flex justify-between">
                              <span class="text-white/60">Holati:</span>
                              <span class="text-white font-medium px-2 py-1 rounded-lg text-xs ${getStatusColor(request.status)}">
                                  ${getStatusText(request.status)}
                              </span>
                          </div>
                      </div>
                  </div>

                  <!-- Description -->
                  ${request.description ? `
                  <div class="bg-white/5 rounded-xl p-4 border border-white/10">
                      <h3 class="text-sm font-semibold text-white/80 mb-2 flex items-center gap-2">
                          <i class="fas fa-file-alt text-primary text-sm"></i>
                          Tavsif
                      </h3>
                      <p class="text-white/70 text-sm leading-relaxed">${request.description}</p>
                  </div>
                  ` : ''}
              </div>
              
              <div class="flex justify-end gap-3 mt-6">
                  <button onclick="document.getElementById('modalContainer').innerHTML = ''" 
                          class="bg-black/20 text-white/70 px-4 py-2 rounded-lg text-sm hover:bg-white/20 transition-all flex items-center gap-2">
                      <i class="fas fa-times text-xs"></i> 
                      Yopish
                  </button>
                  ${
                    request.status !== "approved"
                      ? `
                      <button id="approveBtn" 
                              class="bg-primary/20 text-primary px-4 py-2 rounded-lg text-sm hover:bg-primary/30 transition-all flex items-center gap-2">
                          <i class="fas fa-paper-plane text-xs"></i> 
                          Texnikga yuborish
                      </button>
                  `
                      : ""
                  }
              </div>
          </div>
      </div>
    `
    
    if (request.status !== "approved") {
      document.getElementById("approveBtn").addEventListener("click", async () => {
        try {
          await api(`/service/send/${request._id}`, {
            method: "POST",
          })
          showNotification("So'rov muvaffaqiyatli texnikga yuborildi", "success")
          modalContainer.innerHTML = ""
          await displayRequests({ role: "manager" })
        } catch (error) {
          showNotification(error.message || "So'rovni yuborishda xatolik", "error")
        }
      })
    }
  } catch (error) {
    showNotification("So'rov tafsilotlari yuklanmadi", "error")
    modalContainer.innerHTML = ""
  }
}

function getStatusColor(status) {
  switch(status) {
    case 'pending': return 'bg-yellow-500/20 text-yellow-400'
    case 'in_progress': return 'bg-blue-500/20 text-blue-400'
    case 'completed': return 'bg-green-500/20 text-green-400'
    case 'approved': return 'bg-purple-500/20 text-purple-400'
    default: return 'bg-gray-500/20 text-gray-400'
  }
}

function getStatusText(status) {
  switch(status) {
    case 'pending': return 'Kutilmoqda'
    case 'in_progress': return 'Jarayonda'
    case 'completed': return 'Yakunlangan'
    case 'approved': return 'Tasdiqlangan'
    default: return 'Noma\'lum'
  }
}

async function showUpdateModal(requestId) {
  const modalContainer = document.getElementById("modalContainer")
  if (!modalContainer) {
    showNotification("Modal topilmadi", "error")
    return
  }
  try {
    const components = await api("/components")
    modalContainer.innerHTML = `
      <div class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div class="glass-card rounded-2xl p-6 w-full max-w-md shadow-2xl border border-white/20">
              <div class="flex justify-between items-center mb-6">
                  <h2 class="text-xl font-bold text-white flex items-center gap-2">
                      <i class="fas fa-check-circle text-primary"></i>
                      So'rovni Yakunlash
                  </h2>
                  <button onclick="document.getElementById('modalContainer').innerHTML = ''" 
                          class="text-white/60 hover:text-white text-xl hover:bg-black/20 rounded-lg p-2 transition-all">
                      <i class="fas fa-times"></i>
                  </button>
              </div>
              
              <form id="updateRequestForm" class="space-y-5">
                  <!-- Price Input -->
                  <div class="space-y-2">
                      <label for="price" class="block text-sm font-medium text-white/80 flex items-center gap-2">
                          <i class="fas fa-money-bill text-primary text-xs"></i>
                          Narx (UZS)
                      </label>
                      <input type="number" id="price" name="price" required min="0" step="1000"
                             placeholder="Masalan: 150000"
                             class="w-full p-3 bg-black/20 border border-white/20 rounded-lg text-white placeholder-white/40 focus:ring-2 focus:ring-primary focus:border-transparent transition-all">
                  </div>

                  <!-- Finish Time Input -->
                  <div class="space-y-2">
                      <label for="finishedAt" class="block text-sm font-medium text-white/80 flex items-center gap-2">
                          <i class="fas fa-calendar-check text-primary text-xs"></i>
                          Tugash Vaqti
                      </label>
                      <input type="datetime-local" id="finishedAt" name="finishedAt" required
                             class="w-full p-3 bg-black/20 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all">
                  </div>

                  <!-- Component Selection -->
                  <div class="space-y-3">
                      <label class="block text-sm font-medium text-white/80 flex items-center gap-2">
                          <i class="fas fa-microchip text-primary text-xs"></i>
                          Ishlatilgan Komponent
                      </label>
                      
                      <div class="space-y-3">
                          <select id="componentSelect" name="componentId"
                                  class="w-full p-3 bg-black/20 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all">
                              <option value="">Komponent tanlang (ixtiyoriy)</option>
                              ${components.map((c) => 
                                `<option value="${c._id}" data-price="${c.price}" data-max="${c.quantity}">
                                  ${c.name} - $${c.price} (${c.quantity} dona mavjud)
                                </option>`
                              ).join("")}
                          </select>

                          <div id="quantityContainer" class="hidden">
                              <label for="componentQuantity" class="block text-sm text-white/60 mb-2">
                                  Ishlatilgan miqdor
                              </label>
                              <input type="number" id="componentQuantity" name="componentQuantity" 
                                     min="1" placeholder="Miqdorni kiriting"
                                     class="w-full p-3 bg-black/20 border border-white/20 rounded-lg text-white placeholder-white/40 focus:ring-2 focus:ring-primary focus:border-transparent transition-all">
                              <div id="quantityInfo" class="text-xs text-white/50 mt-1"></div>
                          </div>
                      </div>
                  </div>

                  <!-- Submit Button -->
                  <button type="submit" 
                          class="w-full bg-primary hover:bg-primary/80 py-3 rounded-lg text-white font-semibold transition-all flex items-center justify-center gap-2 mt-6">
                      <i class="fas fa-check"></i>
                      So'rovni Yakunlash
                  </button>
              </form>
          </div>
      </div>
    `

    // Component selection logic
    const componentSelect = document.getElementById("componentSelect")
    const quantityContainer = document.getElementById("quantityContainer")
    const quantityInput = document.getElementById("componentQuantity")
    const quantityInfo = document.getElementById("quantityInfo")

    componentSelect.addEventListener("change", function() {
      if (this.value) {
        const selectedOption = this.selectedOptions[0]
        const maxQuantity = selectedOption.dataset.max
        const price = selectedOption.dataset.price
        
        quantityContainer.classList.remove("hidden")
        quantityInput.max = maxQuantity
        quantityInput.value = "1"
        quantityInfo.textContent = `Maksimal: ${maxQuantity} dona, Narx: $${price}`
      } else {
        quantityContainer.classList.add("hidden")
        quantityInput.value = ""
      }
    })

    // Set default finish time to current time
    const now = new Date()
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
    document.getElementById("finishedAt").value = now.toISOString().slice(0, 16)

    // Form submission
    document.getElementById("updateRequestForm").addEventListener("submit", async (e) => {
      e.preventDefault()
      const formData = new FormData(e.target)
      
      const updateData = {
        requestId,
        price: Number.parseFloat(formData.get("price")),
        finishedAt: new Date(formData.get("finishedAt")).toISOString(),
        components: []
      }

      // Add component if selected
      const componentId = formData.get("componentId")
      const componentQuantity = formData.get("componentQuantity")
      
      if (componentId && componentQuantity) {
        const quantity = Number.parseInt(componentQuantity)
        const maxQuantity = Number.parseInt(componentSelect.selectedOptions[0]?.dataset.max || 0)
        
        if (quantity > maxQuantity) {
          showNotification("Omborda yetarli miqdor yo'q", "error")
          return
        }
        
        updateData.components.push({
          componentId: componentId,
          quantity: quantity
        })
      }

      try {
        await api("/service-request/update", {
          method: "PUT",
          body: JSON.stringify(updateData),
        })
        showNotification("So'rov muvaffaqiyatli yakunlandi", "success")
        modalContainer.innerHTML = ""
        await displayRequests({ role: "master" })
      } catch (error) {
        showNotification(error.message || "So'rovni yakunlashda xatolik", "error")
      }
    })

  } catch (error) {
    showNotification("Komponentlar yuklanmadi", "error")
    modalContainer.innerHTML = ""
  }
}

async function showAcknowledgeModal(requestId) {
    try {
      await api("/service-request/status/update", {
        method: "PUT",
        body: JSON.stringify({ requestId }),
      })
      showNotification("So'rov muvaffaqiyatli tasdiqlandi", "success")
      await displayRequests()
      await initPage("dashboard")
    } catch (error) {
      showNotification(error.message || "So'rovni tasdiqlashda xatolik", "error")
    }
}

async function markAsComplete(requestId) {
  try {
    await api("/service-request/complete", {
      method: "PUT",
      body: JSON.stringify({ requestId }),
    })
    showNotification("So'rov muvaffaqiyatli yakunlandi", "success")
    await displayRequests({ role: "master" })
  } catch (error) {
    showNotification(error.message || "So'rovni yakunlashda xatolik", "error")
  }
}
