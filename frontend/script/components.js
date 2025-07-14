document.addEventListener("DOMContentLoaded", async () => {
  try {
    const user = await initPage("components")
    if (!["manager", "master"].includes(user.role)) {
      showNotification("Bu sahifaga faqat menejerlar va ustalar kira oladi", "error")
      window.location.href = "index.html"
      return
    }
    await displayComponentsList()
  } catch (error) {
    console.error("Komponentlar sahifasi yuklashda xato:", error)
    showNotification("Sahifa yuklashda xatolik yuz berdi", "error")
    window.location.href = "index.html"
  }
})

async function displayComponentsList() {
  const componentsList = document.getElementById("componentsList")
  try {
    const data = await api("/components")
    componentsList.innerHTML =
      data.length === 0
        ? `
            <div class="text-center py-12">
                <div class="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                    <i class="fas fa-boxes text-gray-400 text-3xl"></i>
                </div>
                <h3 class="text-xl font-bold text-white mb-2">Komponentlar Topilmadi</h3>
                <p class="text-gray-400">Hali hech qanday komponent qo'shilmagan.</p>
            </div>
        `
        : `
            <div class="overflow-x-auto">
                <table class="w-full text-left">
                    <thead>
                        <tr class="text-white">
                            <th class="p-4">Nomi</th>
                            <th class="p-4">Narxi (USD)</th>
                            <th class="p-4">Miqdori</th>
                            <th class="p-4">Qo'shilgan Sana</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data
                          .map(
                            (component) => `
                            <tr class="border-t border-gray-800 text-white">
                                <td class="p-4">${component.name || "N/A"}</td>
                                <td class="p-4">$${component.price || 0}</td>
                                <td class="p-4">${component.quantity || 0}</td>
                                <td class="p-4">${new Date(component.createdAt).toLocaleString()}</td>
                            </tr>
                        `,
                          )
                          .join("")}
                    </tbody>
                </table>
            </div>
        `
  } catch (error){
    console.log(error)
    showNotification("Komponentlarni yuklashda xatolik yuz berdi", "error")
    componentsList.innerHTML = `
            <div class="text-center py-12">
                <div class="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                    <i class="fas fa-exclamation-circle text-gray-400 text-3xl"></i>
                </div>
                <h3 class="text-xl font-bold text-white mb-2">Ma'lumotlarni Yuklashda Xatolik</h3>
                <p class="text-gray-400">Iltimos, keyinroq qayta urinib ko'ring.</p>
            </div>
        `
  }
}


function showCreateComponent() {
  const modalContainer = document.getElementById("modalContainer")
  modalContainer.innerHTML = `
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div class="glass-card rounded-2xl p-8 max-w-lg w-full">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-2xl font-bold text-white">Yangi Component Qo'shish</h2>
                    <button onclick="document.getElementById('modalContainer').innerHTML = ''" class="text-gray-400 hover:text-white">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                <form id="addStaffForm" class="space-y-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="space-y-1">
                            <label for="name" class="block text-sm font-medium text-gray-300">Nomi *</label>
                            <input type="text" id="name" name="name" required
                                placeholder="Nomini kiriting"
                                class="w-full px-4 py-3 glass-card rounded-xl text-white placeholder-white focus:outline-none focus:ring-2 focus:ring-primary transition-all">
                        </div>
                        <div class="space-y-1">
                            <label for="price" class="block text-sm font-medium text-gray-300">Narxi *</label>
                            <input type="number" id="price" name="price" required
                                placeholder="Narxni kiriting"
                                class="w-full px-4 py-3 glass-card rounded-xl text-white placeholder-white focus:outline-none focus:ring-2 focus:ring-primary transition-all">
                        </div>
                    </div>
                    <div class="space-y-1">
                        <label for="quantity" class="block text-sm font-medium text-gray-300">Parol *</label>
                        <input type="number" id="quantity" name="quantity" required
                            placeholder="Parolni kiriting"
                            class="w-full px-4 py-3 glass-card rounded-xl text-white placeholder-white focus:outline-none focus:ring-2 focus:ring-primary transition-all">
                    </div>
                    <div class="space-y-1">
                        <label for="description" class="block text-sm font-medium text-gray-300">Tavsif *</label>
                        <textarea placeholder="Tavsifni kiriting" id="description" name="description" required class="w-full px-4 py-3 glass-card rounded-xl text-white placeholder-white focus:outline-none focus:ring-2 focus:ring-primary transition-all"></textarea>
                    </div>
                    <div class="flex justify-end">
                        <button id="addComponent" type="submit" class="bg-primary/60 px-8 py-3 rounded-xl text-white font-semibold hover:shadow-lg transition-all inline-flex items-center">
                            <span id="submitText">Xodim Qo'shish</span>
                            <i id="submitLoader" class="fas fa-spinner fa-spin ml-2 hidden"></i>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `

  document.querySelector('#addStaffForm').addEventListener("submit", async function (e) {
    e.preventDefault()
    const submitButton = this.querySelector('button[type="submit"]')
    const submitText = document.getElementById("submitText")
    const submitLoader = document.getElementById("submitLoader")
    submitButton.disabled = true
    submitText.textContent = "Yuborilmoqda..."
    submitLoader.classList.remove("hidden")
    const formData = new FormData(this)
    await addComponent(Object.fromEntries(formData))
    submitButton.disabled = false
    submitText.textContent = "Xodim Qo'shish"
    submitLoader.classList.add("hidden")
  })
}

async function addComponent(data) {
  try {
    await api("/components", {
      method: "POST",
      body: JSON.stringify(data),
    })
    showNotification("Extiyot qism muvaffaqiyatli qo'shildi", "success")
    await displayComponentsList()
  } catch (error) {
    console.error("Extiyot qism qo'shishda xato:", error)
    showNotification("Extiyot qism qo'shishda xatolik yuz berdi", "error")
  }
}