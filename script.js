const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const todayISO=()=>{const d=new Date();return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10)};
const fmtDate=d=>{if(!d)return"—";return new Date(d+"T00:00:00").toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})};
const initials=name=>name.split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join("").toUpperCase();
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
const toast=msg=>{const t=$("#toast");t.textContent=msg;t.classList.add("show");clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>t.classList.remove("show"),2300)};
const uid=()=>Date.now()+Math.floor(Math.random()*999);

let departments=JSON.parse(localStorage.getItem("pd_departments")||"null")||[
 {id:1,name:"Engineering",lead:"Arjun Mehta",description:"Product engineering, development and technical infrastructure."},
 {id:2,name:"Design",lead:"Ananya Singh",description:"Product design, UX research and brand experience."},
 {id:3,name:"Marketing",lead:"Priya Kapoor",description:"Growth, communications and customer acquisition."},
 {id:4,name:"Human Resources",lead:"Neha Sharma",description:"People operations, hiring and employee experience."},
 {id:5,name:"Finance",lead:"Rohan Gupta",description:"Financial planning, accounting and business operations."},
 {id:6,name:"Sales",lead:"Karan Malhotra",description:"Revenue, partnerships and customer relationships."}
];
let employees=JSON.parse(localStorage.getItem("pd_employees")||"null")||[
 {id:1001,name:"Arjun Mehta",email:"arjun@peopledesk.com",phone:"+91 98765 10001",department:"Engineering",role:"Senior Software Engineer",status:"Active",joinDate:"2024-02-12",salary:1250000,address:"Noida, Uttar Pradesh",notes:""},
 {id:1002,name:"Ananya Singh",email:"ananya@peopledesk.com",phone:"+91 98765 10002",department:"Design",role:"Product Designer",status:"Active",joinDate:"2024-05-20",salary:920000,address:"Delhi",notes:""},
 {id:1003,name:"Priya Kapoor",email:"priya@peopledesk.com",phone:"+91 98765 10003",department:"Marketing",role:"Marketing Manager",status:"On Leave",joinDate:"2023-09-14",salary:1050000,address:"Gurugram, Haryana",notes:""},
 {id:1004,name:"Rohan Gupta",email:"rohan@peopledesk.com",phone:"+91 98765 10004",department:"Finance",role:"Financial Analyst",status:"Active",joinDate:"2025-01-06",salary:760000,address:"Mathura, Uttar Pradesh",notes:""},
 {id:1005,name:"Neha Sharma",email:"neha@peopledesk.com",phone:"+91 98765 10005",department:"Human Resources",role:"HR Executive",status:"Active",joinDate:"2024-08-01",salary:680000,address:"Agra, Uttar Pradesh",notes:""},
 {id:1006,name:"Karan Malhotra",email:"karan@peopledesk.com",phone:"+91 98765 10006",department:"Sales",role:"Sales Lead",status:"Active",joinDate:"2023-11-22",salary:980000,address:"Noida, Uttar Pradesh",notes:""},
 {id:1007,name:"Vivek Joshi",email:"vivek@peopledesk.com",phone:"+91 98765 10007",department:"Engineering",role:"Frontend Developer",status:"Inactive",joinDate:"2022-07-18",salary:720000,address:"Jaipur, Rajasthan",notes:""}
];
const save=()=>{localStorage.setItem("pd_departments",JSON.stringify(departments));localStorage.setItem("pd_employees",JSON.stringify(employees))};
let currentView="dashboard", editingId=null;

function render(){
  $("#totalEmployees").textContent=employees.length;
  $("#totalDepartments").textContent=departments.length;
  $("#onLeave").textContent=employees.filter(e=>e.status==="On Leave").length;
  const active=employees.filter(e=>e.status==="Active").length;
  $("#activeEmployees").textContent=active;
  $("#activePercent").textContent=(employees.length?Math.round(active/employees.length*100):0)+"% of workforce";
  $("#navEmployeeCount").textContent=employees.length;
  populateDepartmentSelects();
  renderChart("barChart","department");
  renderRecent();
  renderEmployees();
  renderDepartments();
  renderReports();
}
function populateDepartmentSelects(){
  const current=$("#departmentFilter").value||"all", edit=$("#employeeDepartment").value;
  $("#departmentFilter").innerHTML='<option value="all">All departments</option>'+departments.map(d=>`<option>${esc(d.name)}</option>`).join("");
  $("#departmentFilter").value=departments.some(d=>d.name===current)?current:"all";
  $("#employeeDepartment").innerHTML=departments.map(d=>`<option>${esc(d.name)}</option>`).join("");
  if(departments.some(d=>d.name===edit))$("#employeeDepartment").value=edit;
}
function renderChart(id,type){
  const box=$("#"+id); if(!box)return;
  const counts={};
  if(type==="status"){employees.forEach(e=>counts[e.status]=(counts[e.status]||0)+1)}
  else employees.forEach(e=>counts[e.department]=(counts[e.department]||0)+1);
  const entries=Object.entries(counts), max=Math.max(...entries.map(x=>x[1]),1);
  box.innerHTML=entries.length?entries.map(([label,n])=>`<div class="bar-item"><span class="bar-value">${n}</span><div class="bar-track"><div class="bar" style="height:${Math.max(4,n/max*100)}%"></div></div><span class="bar-label" title="${esc(label)}">${esc(label)}</span></div>`).join(""):'<div class="empty">No data</div>';
}
function renderRecent(){
  const list=[...employees].sort((a,b)=>b.id-a.id).slice(0,5);
  $("#recentEmployees").innerHTML=list.map(e=>`<div class="recent-row">
   <div class="person"><span class="person-avatar">${initials(e.name)}</span><div><strong>${esc(e.name)}</strong><small>${esc(e.email)}</small></div></div>
   <div class="cell">${esc(e.department)}</div><div class="cell muted">${esc(e.role)}</div>
   <div class="cell"><span class="status ${e.status==="Active"?"status-active":e.status==="On Leave"?"status-leave":"status-inactive"}">${e.status}</span></div>
   <button class="link-btn" onclick="editEmployee(${e.id})">Edit</button></div>`).join("");
}
function filteredEmployees(){
  const q=$("#employeeSearch").value.trim().toLowerCase(), dep=$("#departmentFilter").value, status=$("#statusFilter").value, sort=$("#sortEmployees").value;
  let arr=employees.filter(e=>(!q||(e.name+" "+e.email+" "+e.id+" "+e.role).toLowerCase().includes(q))&&(dep==="all"||e.department===dep)&&(status==="all"||e.status===status));
  if(sort==="name")arr.sort((a,b)=>a.name.localeCompare(b.name));
  else if(sort==="salary")arr.sort((a,b)=>(b.salary||0)-(a.salary||0));
  else arr.sort((a,b)=>b.id-a.id);
  return arr;
}
function renderEmployees(){
  const arr=filteredEmployees();
  $("#employeeResultCount").textContent=`${arr.length} employee${arr.length!==1?"s":""}`;
  $("#employeeEmpty").classList.toggle("hidden",arr.length>0);
  $("#employeeTable").innerHTML=arr.map(e=>`<tr>
   <td><div class="table-person"><span class="person-avatar">${initials(e.name)}</span><div><strong>${esc(e.name)}</strong><small>${esc(e.email)} · #${e.id}</small></div></div></td>
   <td>${esc(e.department)}</td><td>${esc(e.role)}</td>
   <td><span class="status ${e.status==="Active"?"status-active":e.status==="On Leave"?"status-leave":"status-inactive"}">${e.status}</span></td>
   <td>${fmtDate(e.joinDate)}</td>
   <td><button class="action-btn" title="Edit" onclick="editEmployee(${e.id})">✎</button><button class="action-btn" title="Delete" onclick="deleteEmployee(${e.id})">×</button></td>
  </tr>`).join("");
}
function renderDepartments(){
  $("#departmentCards").innerHTML=departments.map(d=>{
    const count=employees.filter(e=>e.department===d.name).length;
    return `<article class="panel department-card"><div class="dept-icon">▤</div><h3>${esc(d.name)}</h3><p>${esc(d.description||"No department description added.")}</p><div class="dept-meta"><span>${count} employee${count!==1?"s":""}</span><span>Lead: ${esc(d.lead||"Not assigned")}</span></div><div class="dept-actions"><button onclick="filterDepartment('${esc(d.name).replace(/'/g,"\\'")}')">View team</button><button onclick="deleteDepartment(${d.id})">Delete</button></div></article>`;
  }).join("");
}
function renderReports(){
  const a=employees.filter(e=>e.status==="Active").length,l=employees.filter(e=>e.status==="On Leave").length,i=employees.filter(e=>e.status==="Inactive").length;
  $("#reportTotal").textContent=employees.length;$("#reportActive").textContent=a;$("#reportLeave").textContent=l;$("#reportInactive").textContent=i;
  renderChart("reportChart","department");
}
function switchView(view){
  currentView=view;
  $$(".view").forEach(v=>v.classList.add("hidden"));
  $("#"+view+"View").classList.remove("hidden");
  $$(".nav-link").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
  if(view==="dashboard")renderChart("barChart",$("#chartSelect").value);
  window.scrollTo({top:0,behavior:"smooth"});
}
function openEmployeeModal(employee=null){
  editingId=employee?.id||null;
  $("#employeeModalTitle").textContent=employee?"Edit employee":"Add employee";
  $("#employeeId").value=employee?.id||"";
  $("#employeeName").value=employee?.name||"";
  $("#employeeEmail").value=employee?.email||"";
  $("#employeePhone").value=employee?.phone||"";
  $("#employeeDepartment").value=employee?.department||departments[0]?.name||"";
  $("#employeeRole").value=employee?.role||"";
  $("#employeeStatus").value=employee?.status||"Active";
  $("#employeeJoinDate").value=employee?.joinDate||todayISO();
  $("#employeeSalary").value=employee?.salary||"";
  $("#employeeAddress").value=employee?.address||"";
  $("#employeeNotes").value=employee?.notes||"";
  $("#formAvatar").textContent=employee?initials(employee.name):"+";
  $("#employeeModal").classList.remove("hidden");
  $("#employeeName").focus();
}
function closeEmployeeModal(){$("#employeeModal").classList.add("hidden")}
function editEmployee(id){const e=employees.find(x=>x.id===id);if(e)openEmployeeModal(e)}
function deleteEmployee(id){const e=employees.find(x=>x.id===id);if(!e)return;if(confirm(`Delete ${e.name}'s employee record?`)){employees=employees.filter(x=>x.id!==id);save();render();toast("Employee deleted")}}
function filterDepartment(name){$("#departmentFilter").value=name;switchView("employees");renderEmployees()}
function openDepartmentModal(){$("#departmentModal").classList.remove("hidden");$("#departmentName").focus()}
function closeDepartmentModal(){$("#departmentModal").classList.add("hidden")}
function deleteDepartment(id){
  const d=departments.find(x=>x.id===id);if(!d)return;
  if(employees.some(e=>e.department===d.name)){toast("Move employees before deleting this department");return}
  if(confirm(`Delete ${d.name}?`)){departments=departments.filter(x=>x.id!==id);save();render();toast("Department deleted")}
}
function exportCSV(){
  const rows=employees.map(e=>[e.id,e.name,e.email,e.phone,e.department,e.role,e.status,e.joinDate,e.salary,e.address]);
  const csv=[["Employee ID","Name","Email","Phone","Department","Role","Status","Joining Date","Annual Salary","Address"],...rows].map(r=>r.map(v=>`"${String(v??"").replace(/"/g,'""')}"`).join(",")).join("\n");
  const blob=new Blob([csv],{type:"text/csv;charset=utf-8"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="peopledesk-employees.csv";a.click();URL.revokeObjectURL(a.href);toast("CSV exported successfully ✓")
}
function printReport(){window.print()}

$("#loginForm").addEventListener("submit",e=>{
  e.preventDefault();const email=$("#loginEmail").value.trim().toLowerCase(),pass=$("#loginPassword").value;
  const users=JSON.parse(localStorage.getItem("pd_users")||"[]");
  const found=users.find(u=>u.email===email);
  if(email==="admin@peopledesk.com"&&pass==="admin123" || found&&found.password===pass){
    const user=found||{name:"Admin User",role:"Administrator",email};
    sessionStorage.setItem("pd_current_user",JSON.stringify(user));enterApp(user);
  }else toast("Invalid credentials. Try the demo login.");
});
function enterApp(user){
  $("#authScreen").classList.add("hidden");$("#appScreen").classList.remove("hidden");
  const first=(user.name||"Admin").split(" ")[0];$("#greetingName").textContent=first;$("#sidebarUser").textContent=user.name||"Admin User";$("#sidebarRole").textContent=user.role||"Administrator";$("#sidebarAvatar").textContent=initials(user.name||"Admin User");$("#profileBtn").textContent=initials(user.name||"Admin User");
  render();
}
$$("[data-toggle]").forEach(b=>b.onclick=()=>{const input=$("#"+b.dataset.toggle);input.type=input.type==="password"?"text":"password";b.textContent=input.type==="password"?"Show":"Hide"});
$("#showSignup").onclick=()=>{$("#loginCard").classList.add("hidden");$("#signupCard").classList.remove("hidden")};
$("#showLogin").onclick=()=>{$("#signupCard").classList.add("hidden");$("#loginCard").classList.remove("hidden")};
$("#signupForm").addEventListener("submit",e=>{
  e.preventDefault();const first=$("#signupFirst").value.trim(),last=$("#signupLast").value.trim(),email=$("#signupEmail").value.trim().toLowerCase(),pass=$("#signupPassword").value,confirmPass=$("#signupConfirm").value;
  if(pass!==confirmPass){toast("Passwords do not match");return}
  const users=JSON.parse(localStorage.getItem("pd_users")||"[]");if(users.some(u=>u.email===email)||email==="admin@peopledesk.com"){toast("An account with this email already exists");return}
  const user={name:first+" "+last,email,password:pass,role:$("#signupRole").value};users.push(user);localStorage.setItem("pd_users",JSON.stringify(users));sessionStorage.setItem("pd_current_user",JSON.stringify(user));$("#signupForm").reset();toast("Account created successfully ✓");setTimeout(()=>enterApp(user),350)
});
$("#logoutBtn").onclick=()=>{sessionStorage.removeItem("pd_current_user");$("#appScreen").classList.add("hidden");$("#authScreen").classList.remove("hidden");$("#loginForm").reset();toast("Signed out successfully")};
$("#forgotPassword").onclick=()=>toast("Demo app: please create a new account or use the demo credentials.");
$("#quickAdd").onclick=()=>openEmployeeModal();$("#addEmployeeBtn").onclick=()=>openEmployeeModal();
$("#closeEmployeeModal").onclick=closeEmployeeModal;$("#cancelEmployee").onclick=closeEmployeeModal;$("#employeeModal .modal-backdrop").onclick=closeEmployeeModal;
$("#employeeName").oninput=e=>$("#formAvatar").textContent=initials(e.target.value)||"+";
$("#employeeForm").addEventListener("submit",e=>{
  e.preventDefault();const data={id:editingId||uid(),name:$("#employeeName").value.trim(),email:$("#employeeEmail").value.trim(),phone:$("#employeePhone").value.trim(),department:$("#employeeDepartment").value,role:$("#employeeRole").value.trim(),status:$("#employeeStatus").value,joinDate:$("#employeeJoinDate").value,salary:Number($("#employeeSalary").value)||0,address:$("#employeeAddress").value.trim(),notes:$("#employeeNotes").value.trim()};
  if(employees.some(x=>x.email.toLowerCase()===data.email.toLowerCase()&&x.id!==data.id)){toast("That email is already in use");return}
  if(editingId)employees=employees.map(x=>x.id===editingId?data:x);else employees.unshift(data);
  save();render();closeEmployeeModal();toast(editingId?"Employee updated ✓":"Employee added successfully ✓")
});
$("#addDepartmentBtn").onclick=openDepartmentModal;$("#closeDepartmentModal").onclick=closeDepartmentModal;$("#cancelDepartment").onclick=closeDepartmentModal;$("#departmentModal .modal-backdrop").onclick=closeDepartmentModal;
$("#departmentForm").addEventListener("submit",e=>{e.preventDefault();const name=$("#departmentName").value.trim();if(departments.some(d=>d.name.toLowerCase()===name.toLowerCase())){toast("Department already exists");return}departments.push({id:uid(),name,lead:$("#departmentLead").value.trim(),description:$("#departmentDescription").value.trim()});save();render();closeDepartmentModal();e.target.reset();toast("Department created ✓")});
$$(".nav-link").forEach(b=>b.onclick=()=>switchView(b.dataset.view));
$$("[data-view]").filter(b=>b.classList.contains("link-btn")).forEach(b=>b.onclick=()=>switchView(b.dataset.view));
$$(".quick-actions button").forEach(b=>b.onclick=()=>{const a=b.dataset.action;if(a==="add")openEmployeeModal();else switchView(a)});
$("#chartSelect").onchange=e=>renderChart("barChart",e.target.value);
$("#employeeSearch").oninput=renderEmployees;$("#departmentFilter").onchange=renderEmployees;$("#statusFilter").onchange=renderEmployees;$("#sortEmployees").onchange=renderEmployees;
$("#globalSearch").oninput=e=>{const q=e.target.value.trim();if(q){switchView("employees");$("#employeeSearch").value=q;renderEmployees()}};
$("#exportCsv").onclick=exportCSV;$("#reportCsv").onclick=exportCSV;$("#downloadSummary").onclick=exportCSV;$("#printReport").onclick=printReport;$("#printEmployeeReport").onclick=printReport;$("#printDepartmentReport").onclick=printReport;
$("#themeBtn").onclick=()=>{document.body.classList.toggle("dark");localStorage.setItem("pd_theme",document.body.classList.contains("dark")?"dark":"light")};
$("#notificationBtn").onclick=()=>toast("You have 3 new organization updates.");
$("#profileBtn").onclick=()=>switchView("settings");
$("#helpBtn").onclick=()=>toast("Use Employees to add/edit records and Reports to export data.");
$("#saveSettings").onclick=()=>toast("Workspace settings saved ✓");
if(localStorage.getItem("pd_theme")==="dark")document.body.classList.add("dark");
const existing=sessionStorage.getItem("pd_current_user");if(existing){try{enterApp(JSON.parse(existing))}catch{}}
render();