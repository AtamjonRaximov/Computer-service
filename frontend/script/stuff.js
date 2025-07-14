
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const user = await initPage("staff")
    if (user.role !== "manager") {
      showNotification("Bu sahifaga faqat menejerlar kira oladi", "error")
      window.location.href = "index.html"
      return
    }
    await displayStaffList()
  } catch (error) {
    console.error("Staff sahifasi yuklashda xato:", error)
    showNotification("Sahifa yuklashda xatolik yuz berdi", "error")
    window.location.href = "index.html"
  }
})

async function displayStaffList() {
  const staffList = document.getElementById("staffList")
  if (!staffList) {
    console.error("staffList elementi topilmadi")
    showNotification("Sahifa yuklashda xatolik", "error")
    return
  }
  try {
    const data = await api("/users")
    staffList.innerHTML =
      data.length === 0
        ? `
            <div class="text-center py-12">
                <div class="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                    <i class="fas fa-users text-gray-400 text-3xl"></i>
                </div>
                <h3 class="text-xl font-bold text-white mb-2">Xodimlar Topilmadi</h3>
                <p class="text-white">Hali hech qanday xodim qo'shilmagan.</p>
            </div>
        `
        : `
            <div class="overflow-x-auto">
                <table class="w-full text-left">
                    <thead>
                        <tr class="text-white">
                            <th class="p-4">Ism</th>
                            <th class="p-4">Email</th>
                            <th class="p-4">Rol</th>
                            <th class="p-4">Qo'shilgan Sana</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data
                          .map(
                            (member) => `
                            <tr class="border-t text-white">
                                <td class="p-4">${member.firstName || ""} ${member.lastName || ""}</td>
                                <td class="p-4">${member.email || "N/A"}</td>
                                <td class="p-4">${member.role?.charAt(0).toUpperCase() + member.role?.slice(1) || "N/A"}</td>
                                <td class="p-4">${formatDate(member.createdAt)}</td>
                            </tr>
                        `,
                          )
                          .join("")}
                    </tbody>
                </table>
            </div>
        `
  } catch (error) {
    console.error("Xodimlarni yuklashda xato:", error)
    showNotification("Xodimlarni yuklashda xatolik yuz berdi", "error")
    staffList.innerHTML = `
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

function showNotification(message, type) {
  const notificationContainer = document.getElementById("notificationContainer")
  if (!notificationContainer) {
    console.error("notificationContainer elementi topilmadi")
    return
  }
  notificationContainer.innerHTML = `
        <div class="fixed bottom-4 right-4 bg-${type}-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center">
            <i class="fas fa-${type === "success" ? "check-circle" : "exclamation-circle"} mr-2"></i>
            <p>${message}</p>
        </div>
    `
  setTimeout(() => {
    notificationContainer.innerHTML = ""
  }, 3000)
}

function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

async function addStaff(userData) {
  try {
    const response = await fetch("/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    })
    if (!response.ok) {
      throw new Error("Staff addition failed")
    }
    showNotification("Xodim muvaffaqiyatli qo'shildi", "success")
    await displayStaffList()
  } catch (error) {
    console.error("Xodim qo'shishda xato:", error)
    showNotification("Xodim qo'shishda xatolik yuz berdi", "error")
  }
}


