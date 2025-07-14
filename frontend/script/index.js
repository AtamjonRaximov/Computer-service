async function createServiceRequest(requestData) {
    try {
      const data = await api("/service/create", {
        method: "POST",
        body: JSON.stringify(requestData),
      })
      showNotification(
        data.message || "Xizmat so'rovi muvaffaqiyatli yuborildi! 24 soat ichida siz bilan bog'lanamiz.",
        "success",
      )
      document.getElementById("serviceRequestForm").reset()
    } catch (error) {
      showNotification(error.message || "Xizmat so'rovini yuborishda xatolik", "error")
    }
  }
  
document.addEventListener("DOMContentLoaded", () => {
    const serviceRequestForm = document.getElementById("serviceRequestForm")
    if (serviceRequestForm) {
      serviceRequestForm.addEventListener("submit", async function (e) {
        e.preventDefault()
        const submitButton = this.querySelector('button[type="submit"]')
        const submitText = document.getElementById("submitText")
        const submitLoader = document.getElementById("submitLoader")
        submitButton.disabled = true
        submitText.textContent = "Yuborilmoqda..."
        submitLoader.classList.remove("hidden")
        const formData = new FormData(this)
        await createServiceRequest(Object.fromEntries(formData))
        submitButton.disabled = false
        submitText.textContent = "Ta'mirlash So'rovini Yuborish"
        submitLoader.classList.add("hidden")
      })
    }
  })
  