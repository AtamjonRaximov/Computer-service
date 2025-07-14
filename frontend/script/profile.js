document.addEventListener("DOMContentLoaded", async () => {
  try {
    const user = await initPage("profile")
    await displayProfileInfo(user)
    setupUpdateProfileForm(user)
  } catch (error) {
    console.error("Profil sahifasi yuklashda xato:", error)
    showNotification("Sahifa yuklashda xatolik yuz berdi", "error")
    window.location.href = "index.html"
  }
})
  

  async function displayProfileInfo(user) {
    const profileInfo = document.getElementById("profileInfo")
    profileInfo.innerHTML = `
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                  <span class="text-gray-400">Ism:</span>
                  <span class="text-white ml-2">${user.firstName || "Ko‘rsatilmagan"}</span>
              </div>
              <div>
                  <span class="text-gray-400">Familiya:</span>
                  <span class="text-white ml-2">${user.lastName || "Ko‘rsatilmagan"}</span>
              </div>
              <div>
                  <span class="text-gray-400">Email:</span>
                  <span class="text-white ml-2">${user.email || "N/A"}</span>
              </div>
              <div>
                  <span class="text-gray-400">Rol:</span>
                  <span class="text-white ml-2">${user.role?.charAt(0).toUpperCase() + user.role?.slice(1) || "N/A"}</span>
              </div>
          </div>
      `
  }
  
  function setupUpdateProfileForm(user) {
    const form = document.getElementById("updateProfileForm")
    form.querySelector("#firstName").value = user.firstName || ""
    form.querySelector("#lastName").value = user.lastName || ""
  
    form.addEventListener("submit", async (e) => {
      e.preventDefault()
      const submitButton = form.querySelector('button[type="submit"]')
      const submitText = document.getElementById("submitText")
      const submitLoader = document.getElementById("submitLoader")
      submitButton.disabled = true
      submitText.textContent = "Yangilanmoqda..."
      submitLoader.classList.remove("hidden")
      const formData = new FormData(form)
      const updateData = {
        firstName: formData.get("firstName"),
        lastName: formData.get("lastName"),
      }
      const password = formData.get("password")
      if (password) {
        updateData.password = password
      }
      try {
        await api("/users-profile", {
          method: "PUT",
          body: JSON.stringify(updateData),
        })
        showNotification("Profil muvaffaqiyatli yangilandi", "success")
        const updatedUser = await api("/auth/current-user")
        await displayProfileInfo(updatedUser)
        form.querySelector("#firstName").value = updatedUser.firstName || ""
        form.querySelector("#lastName").value = updatedUser.lastName || ""
        form.querySelector("#password").value = ""
        await initPage("profile")
      } catch (error) {
        showNotification(error.message || "Profil yangilashda xatolik", "error")
      } finally {
        submitButton.disabled = false
        submitText.textContent = "Ma‘lumotlarni Yangilash"
        submitLoader.classList.add("hidden")
      }
    })
  }
  