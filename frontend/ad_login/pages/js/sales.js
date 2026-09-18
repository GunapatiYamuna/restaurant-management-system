let sales = JSON.parse(localStorage.getItem("sales")) || [];

function saveData() {
  localStorage.setItem("sales", JSON.stringify(sales));
}

function addSale() {
  let date = document.getElementById("date").value;
  let orders = document.getElementById("orders").value;
  let revenue = document.getElementById("revenue").value;
  let cost = document.getElementById("cost").value;

  if (!date || !orders || !revenue || !cost) {
    alert("Fill all fields");
    return;
  }

  let profit = revenue - cost;

  sales.push({
    date,
    orders,
    revenue,
    cost,
    profit
  });

  saveData();
  renderTable();
}

function renderTable() {
  let table = document.getElementById("salesTable");
  let search = document.getElementById("search").value.toLowerCase();

  table.innerHTML = "";

  sales.forEach((s, index) => {
    if (!s.date.toLowerCase().includes(search)) return;

    let row = `
      <tr>
        <td>${s.date}</td>
        <td>${s.orders}</td>
        <td>₹${s.revenue}</td>
        <td>₹${s.cost}</td>
        <td style="color:${s.profit >= 0 ? 'green' : 'red'}">
          ₹${s.profit}
        </td>
        <td>
          <button onclick="editSale(${index})">Edit</button>
          <button onclick="deleteSale(${index})">Delete</button>
        </td>
      </tr>
    `;
    table.innerHTML += row;
  });
}

function deleteSale(index) {
  sales.splice(index, 1);
  saveData();
  renderTable();
}

function editSale(index) {
  let s = sales[index];

  document.getElementById("date").value = s.date;
  document.getElementById("orders").value = s.orders;
  document.getElementById("revenue").value = s.revenue;
  document.getElementById("cost").value = s.cost;

  deleteSale(index);
}

renderTable();