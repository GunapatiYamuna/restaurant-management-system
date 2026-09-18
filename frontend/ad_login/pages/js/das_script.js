let inventory = JSON.parse(localStorage.getItem("inventory")) || [];

/* SAVE */
function saveData() {
  localStorage.setItem("inventory", JSON.stringify(inventory));
}

/* LOAD */
function loadData() {
  document.getElementById("inventoryTable").innerHTML = "";

  inventory.forEach((item, index) => renderRow(item, index));
}

/* STATUS */
function getStatus(qty) {
  if (qty > 10) return ["Available", "text-success"];
  if (qty > 0) return ["Low", "text-warning"];
  return ["Out of Stock", "text-danger"];
}

/* RENDER */
function renderRow(item, index) {
  let [status, color] = getStatus(item.qty);

  let row = `
  <tr>
    <td>${item.name}</td>
    <td>${item.qty} ${item.unit}</td>
    <td class="${color}">${status}</td>
    <td>
      <button class="btn btn-success btn-sm" onclick="changeQty(${index},1)">+</button>
      <button class="btn btn-danger btn-sm" onclick="changeQty(${index},-1)">−</button>
      <button class="btn btn-primary btn-sm" onclick="editItem(${index})"><i class="bi bi-pencil"></i></button>
      <button class="btn btn-dark btn-sm" onclick="deleteItem(${index})"><i class="bi bi-trash"></i></button>
    </td>
  </tr>
  `;

  document.getElementById("inventoryTable").innerHTML += row;
}

/* ADD */
function addItem() {
  let name = document.getElementById("name").value;
  let qty = document.getElementById("qty").value;
  let unit = document.getElementById("unit").value || "pcs";

  if (!name || !qty) {
    alert("Fill all fields");
    return;
  }

  inventory.push({
    name,
    qty: parseInt(qty),
    unit
  });

  saveData();
  loadData();

  document.getElementById("name").value = "";
  document.getElementById("qty").value = "";
  document.getElementById("unit").value = "";
}

/* CHANGE QTY */
function changeQty(index, change) {
  inventory[index].qty += change;

  if (inventory[index].qty < 0) {
    inventory[index].qty = 0;
  }

  saveData();
  loadData();
}

/* DELETE */
function deleteItem(index) {
  if (confirm("Delete this item?")) {
    inventory.splice(index, 1);
    saveData();
    loadData();
  }
}

/* EDIT */
function editItem(index) {
  let item = inventory[index];

  let newName = prompt("Edit Name:", item.name);
  let newQty = prompt("Edit Quantity:", item.qty);
  let newUnit = prompt("Edit Unit:", item.unit);

  if (newName && newQty) {
    inventory[index] = {
      name: newName,
      qty: parseInt(newQty),
      unit: newUnit || "pcs"
    };

    saveData();
    loadData();
  }
}

/* SEARCH */
function searchItem() {
  let value = document.getElementById("search").value.toLowerCase();

  document.getElementById("inventoryTable").innerHTML = "";

  inventory
    .filter(item => item.name.toLowerCase().includes(value))
    .forEach((item, index) => renderRow(item, index));
}

/* INIT */
loadData();