// app.js

document.addEventListener("DOMContentLoaded", () => {
  
  const yearSpan = document.getElementById("year");
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }

  setupReservationForm();
  setupCart();
  setupContactForm();
});

/** RESERVATIONS + AVAILABILITY **/

function setupReservationForm() {
  const availabilityBtn = document.getElementById("check-availability");
  const reservationForm = document.getElementById("reservation-form");
  const availabilityStatus = document.getElementById("availability-status");
  const reservationStatus = document.getElementById("reservation-status");

  if (!reservationForm) return;

  if (availabilityBtn && availabilityStatus) {
    availabilityBtn.addEventListener("click", async () => {
      const formData = getReservationFormData();
      if (!formData) {
        availabilityStatus.textContent = "Please fill in date, time, and party size.";
        availabilityStatus.style.color = "red";
        return;
      }

      try {
        const params = new URLSearchParams({
          date: formData.date,
          time: formData.time,
          partySize: String(formData.partySize),
        });

        const response = await fetch(`/api/availability?${params.toString()}`);
        const data = await response.json();

        if (data.available) {
          availabilityStatus.textContent = `Good news! A table is available. Remaining tables: ${data.remainingTables}`;
          availabilityStatus.style.color = "green";
        } else {
          availabilityStatus.textContent = "Sorry, no tables are available at that time.";
          availabilityStatus.style.color = "red";
        }
      } catch (err) {
        console.error(err);
        availabilityStatus.textContent = "Error checking availability. Please try again.";
        availabilityStatus.style.color = "red";
      }
    });
  }

  reservationForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!reservationStatus) return;

    const formData = getReservationFormData(true);
    if (!formData) {
      reservationStatus.textContent = "Please fill in all required fields.";
      reservationStatus.style.color = "red";
      return;
    }

    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        reservationStatus.textContent = `Reservation confirmed! Confirmation code: ${data.confirmationCode}`;
        reservationStatus.style.color = "green";
        reservationForm.reset();
        const availabilityStatus = document.getElementById("availability-status");
        if (availabilityStatus) availabilityStatus.textContent = "";
      } else {
        reservationStatus.textContent = data.message || "Could not create reservation.";
        reservationStatus.style.color = "red";
      }
    } catch (err) {
      console.error(err);
      reservationStatus.textContent = "Error making reservation. Please try again.";
      reservationStatus.style.color = "red";
    }
  });
}

function getReservationFormData(includeNameEmail = false) {
  const nameInput = document.getElementById("res-name");
  const emailInput = document.getElementById("res-email");
  const dateInput = document.getElementById("res-date");
  const timeInput = document.getElementById("res-time");
  const partyInput = document.getElementById("res-party");
  const notesInput = document.getElementById("res-notes");

  if (!dateInput || !timeInput || !partyInput) return null;

  const date = dateInput.value;
  const time = timeInput.value;
  const partySize = parseInt(partyInput.value, 10);

  if (!date || !time || !partySize) return null;

  const result = {
    date,
    time,
    partySize,
    notes: notesInput ? notesInput.value : "",
  };

  if (includeNameEmail) {
    if (!nameInput || !emailInput) return null;
    if (!nameInput.value || !emailInput.value) return null;

    result.name = nameInput.value;
    result.email = emailInput.value;
  }

  return result;
}

/** CART + ONLINE ORDERING **/

const cart = [];

function setupCart() {
  const addButtons = document.querySelectorAll(".add-to-cart");
  const checkoutButton = document.getElementById("checkout-button");

  addButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const parent = btn.closest(".order-item");
      if (!parent) return;

      const id = parent.getAttribute("data-id");
      const name = parent.getAttribute("data-name");
      const price = parseFloat(parent.getAttribute("data-price") || "0");

      addToCart({ id, name, price });
    });
  });

  if (checkoutButton) {
    checkoutButton.addEventListener("click", handleCheckout);
  }

  renderCart();
}

function addToCart(item) {
  const existing = cart.find((c) => c.id === item.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ ...item, quantity: 1 });
  }
  renderCart();
}

function renderCart() {
  const cartList = document.getElementById("cart-items");
  const totalEl = document.getElementById("cart-total");

  if (!cartList || !totalEl) return;

  cartList.innerHTML = "";

  let total = 0;
  cart.forEach((item) => {
    const li = document.createElement("li");

    const left = document.createElement("span");
    left.textContent = `${item.name} x ${item.quantity}`;

    const right = document.createElement("span");
    const lineTotal = item.price * item.quantity;
    total += lineTotal;
    right.textContent = `$${lineTotal.toFixed(2)}`;

    li.appendChild(left);
    li.appendChild(right);

    cartList.appendChild(li);
  });

  totalEl.textContent = `$${total.toFixed(2)}`;
}

async function handleCheckout() {
  const orderStatus = document.getElementById("order-status");
  if (!orderStatus) return;

  if (cart.length === 0) {
    orderStatus.textContent = "Your cart is empty.";
    orderStatus.style.color = "red";
    return;
  }

  try {
    const response = await fetch("/api/order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ items: cart }),
    });

    const data = await response.json();

    if (response.ok) {
      orderStatus.textContent = `Order placed! Order ID: ${data.orderId}`;
      orderStatus.style.color = "green";
      cart.length = 0; 
      renderCart();
    } else {
      orderStatus.textContent = data.message || "Could not place order.";
      orderStatus.style.color = "red";
    }
  } catch (err) {
    console.error(err);
    orderStatus.textContent = "Error placing order. Please try again.";
    orderStatus.style.color = "red";
  }
}

/** CONTACT FORM  **/

function setupContactForm() {
  const contactForm = document.getElementById("contact-form");
  const contactStatus = document.getElementById("contact-status");

  if (!contactForm || !contactStatus) return;

  contactForm.addEventListener("submit", (e) => {
    e.preventDefault();
    
    contactStatus.textContent = "Thank you! We will get back to you shortly.";
    contactStatus.style.color = "green";
    contactForm.reset();
  });
}
