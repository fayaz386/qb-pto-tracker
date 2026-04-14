require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool();

async function check() {
  console.log("Before:");
  let r = await pool.query("SELECT employee_key, sick_hours_available, sick_hours_accrued FROM employees WHERE employee_key = 'Chris-Solo Capuy'");
  console.log(r.rows);

  // Run the exact UPSERT
  const emp = {
    account_number: "",
    email: "chris_cap633@yahoo.com",
    phone: "437-255-0005",
    hired_date: "2022-04-22",
    birth_date: "1981-10-20",
    job_title: "House Keeping Wages..",
    address: "6060 Snowy Owl Cres, Apt#38, Mississauga, ON, L5N 7K3",
    vacation_hours_available: 0,
    vacation_accrual_period: "",
    vacation_hours_accrued: 0,
    vacation_max_hours: 0,
    vacation_reset_yearly: false,
    vacation_hours_used: 0,
    sick_hours_available: 16,
    sick_accrual_period: "BeginningOfYear",
    sick_hours_accrued: 32,
    sick_max_hours: 0,
    sick_reset_yearly: true,
    sick_hours_used: 16
  };

  const name = "Chris-Solo Capuy";
  const isActive = true;
  const targetHotel = "Holiday Inn & Suites -2565 Argentia";

  try {
    const res = await pool.query(`
      INSERT INTO employees (
          employee_key, display_name, is_active, 
          account_number, email, phone, hired_date, birth_date, job_title, address, hotel,
          vacation_accrual_period, vacation_hours_accrued, vacation_max_hours, vacation_reset_yearly, vacation_hours_used,
          sick_hours_available, sick_accrual_period, sick_hours_accrued, sick_max_hours, sick_reset_yearly, sick_hours_used
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
      ON CONFLICT (employee_key) DO UPDATE SET 
         display_name = EXCLUDED.display_name,
         is_active = EXCLUDED.is_active,
         account_number = EXCLUDED.account_number,
         email = EXCLUDED.email,
         phone = EXCLUDED.phone,
         hired_date = EXCLUDED.hired_date,
         birth_date = EXCLUDED.birth_date,
         job_title = EXCLUDED.job_title,
         address = EXCLUDED.address,
         hotel = EXCLUDED.hotel,
         vacation_accrual_period = EXCLUDED.vacation_accrual_period,
         vacation_hours_accrued = EXCLUDED.vacation_hours_accrued,
         vacation_max_hours = EXCLUDED.vacation_max_hours,
         vacation_reset_yearly = EXCLUDED.vacation_reset_yearly,
         vacation_hours_used = EXCLUDED.vacation_hours_used,
         sick_hours_available = EXCLUDED.sick_hours_available,
         sick_accrual_period = EXCLUDED.sick_accrual_period,
         sick_hours_accrued = EXCLUDED.sick_hours_accrued,
         sick_max_hours = EXCLUDED.sick_max_hours,
         sick_reset_yearly = EXCLUDED.sick_reset_yearly,
         sick_hours_used = EXCLUDED.sick_hours_used
    `, [
      name, name, isActive,
      emp.account_number || null,
      emp.email || null,
      emp.phone || null,
      emp.hired_date || null,
      emp.birth_date || null,
      emp.job_title || null,
      emp.address || null,
      targetHotel || null, // Update hotel!
      emp.vacation_accrual_period || null,
      emp.vacation_hours_accrued || 0,
      emp.vacation_max_hours || 0,
      emp.vacation_reset_yearly || false,
      emp.vacation_hours_used || 0,
      emp.sick_hours_available || 0,
      emp.sick_accrual_period || null,
      emp.sick_hours_accrued || 0,
      emp.sick_max_hours || 0,
      emp.sick_reset_yearly || false,
      emp.sick_hours_used || 0
    ]);
    console.log("Upsert Success");
  } catch (e) {
    console.error("UPSERT BUG:", e.message);
  }

  console.log("After UPSERT:");
  r = await pool.query("SELECT employee_key, sick_hours_available, sick_hours_accrued FROM employees WHERE employee_key = 'Chris-Solo Capuy'");
  console.log(r.rows);

  await pool.end();
}

check();
