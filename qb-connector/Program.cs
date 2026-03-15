using System;
using System.Collections.Generic;
using System.Net;
using System.Text;
using System.IO;
using System.Web.Script.Serialization;
using System.Runtime.InteropServices;
using System.Xml;
// Removed Early Binding Namespace

namespace QBConnector
{
    class Program
    {
        static void Main(string[] args)
        {
            RunServer();
        }

        static void RunServer()
        {
            int port = 8181;
            HttpListener listener = new HttpListener();
            
            try
            {
                // PUBLIC BINDING (Required for Remote Access)
                listener.Prefixes.Add($"http://*:{port}/");
                listener.Start();
                Console.WriteLine($"[QB Bridge] Listening on http://*:{port} (Public/Remote Mode)...");
                Console.WriteLine($"[Debug] Process Bitness: {(Environment.Is64BitProcess ? "64-bit (BAD)" : "32-bit (GOOD)")}");
            }
            catch (HttpListenerException)
            {
                // FALLBACK: Local Mode (if Admin/URLACL missing)
                try {
                    listener = new HttpListener();
                    listener.Prefixes.Add($"http://localhost:{port}/");
                    listener.Prefixes.Add($"http://127.0.0.1:{port}/");
                    listener.Start();
                    Console.ForegroundColor = ConsoleColor.Green;
                    Console.WriteLine($"[QB Bridge] Fallback: Listening on http://localhost:{port} ONLY (Local Mode).");
                    Console.WriteLine("[Warning] Remote connections will fail. Run as Administrator to enable Public Mode.");
                    Console.WriteLine($"[Debug] Process Bitness: {(Environment.Is64BitProcess ? "64-bit (BAD)" : "32-bit (GOOD)")}");
                    Console.ResetColor();
                } catch {
                    Console.WriteLine($"Fatal Error: Could not bind to port {port}.");
                    return;
                }
            }

            while (true)
            {
                try
                {
                    var context = listener.GetContext();
                    System.Threading.Tasks.Task.Run(() => HandleRequest(context));
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Listener error: {ex.Message}");
                }
            }
        }

        static void HandleRequest(HttpListenerContext context)
        {
            var request = context.Request;
            var response = context.Response;

            response.AddHeader("Access-Control-Allow-Origin", "*");
            response.AddHeader("Access-Control-Allow-Headers", "Content-Type");
            
            if (request.HttpMethod == "OPTIONS")
            {
                response.StatusCode = 200;
                response.Close();
                return;
            }

            var serializer = new JavaScriptSerializer();
            serializer.MaxJsonLength = 50 * 1024 * 1024;
            object responseObj = null;

            try
            {
                string body = "";
                using (var reader = new StreamReader(request.InputStream, request.ContentEncoding))
                {
                    body = reader.ReadToEnd();
                }

                var reqData = serializer.Deserialize<Dictionary<string, object>>(body);
                string action = reqData != null && reqData.ContainsKey("action") ? reqData["action"].ToString() : "unknown";

                Console.WriteLine($"Received action: {action}");

                switch (action.ToLower())
                {
                    case "test":
                        responseObj = TestConnection();
                        break;
                    case "get-employees":
                        responseObj = GetEmployees();
                        break;
                    case "get-vacation-report":
                        responseObj = GetVacationReport();
                        break;
                    case "get-company-info":
                        responseObj = GetCompanyInfo();
                        break;
                    default:
                            responseObj = new { status = "error", message = "Unknown action" };
                            break;
                }
            }
            catch (Exception ex)
            {
                responseObj = new { status = "error", message = ex.Message };
            }

            try
            {
                string json = serializer.Serialize(responseObj);
                byte[] buffer = Encoding.UTF8.GetBytes(json);
                response.ContentType = "application/json";
                response.ContentLength64 = buffer.Length;
                response.OutputStream.Write(buffer, 0, buffer.Length);
                response.Close();
            }
            catch (Exception ex)
            {
                Console.WriteLine("Error sending response: " + ex.Message);
            }
        }

        static object TestConnection()
        {
            return ProcessQBRequest("Debug Report XML", (ticket, rp) => {
                 // DEBUG: Get Payroll Summary Report to find "Vacation Pay Available"
                 // Using "PayrollSummary" as the report type enum.
                 string xml = "<?xml version=\"1.0\" ?><?qbxml version=\"13.0\"?><QBXML><QBXMLMsgsRq onError=\"continueOnError\">" + 
                              "<PayrollSummaryReportQueryRq>" + 
                              "<PayrollSummaryReportType>PayrollSummary</PayrollSummaryReportType>" +
                              "<ReportPeriod><FromReportDate>2020-01-01</FromReportDate><ToReportDate>2026-12-31</ToReportDate></ReportPeriod>" + 
                              "</PayrollSummaryReportQueryRq>" + 
                              "</QBXMLMsgsRq></QBXML>";
                 string res = rp.ProcessRequest(ticket, xml);
                 return new { status = "ok", message = "Debug Report XML", xml = res };
            });
        }

        static object GetEmployees()
        {
             return ProcessQBRequest("Get Employees", (ticket, rp) => {
                // Request Employee Data including Profile Info
                string xml = "<?xml version=\"1.0\" ?><?qbxml version=\"13.0\"?><QBXML><QBXMLMsgsRq onError=\"stopOnError\"><EmployeeQueryRq>" +
                             "<ActiveStatus>All</ActiveStatus>" +
                             "<IncludeRetElement>ListID</IncludeRetElement>" +
                             "<IncludeRetElement>Name</IncludeRetElement>" +
                             "<IncludeRetElement>IsActive</IncludeRetElement>" +
                             "<IncludeRetElement>AccountNumber</IncludeRetElement>" + // Employee #
                             "<IncludeRetElement>EmployeeAddress</IncludeRetElement>" +
                             "<IncludeRetElement>Phone</IncludeRetElement>" +
                             "<IncludeRetElement>Email</IncludeRetElement>" +
                             "<IncludeRetElement>EmployeePayrollInfo</IncludeRetElement>" + // For Hired Date? No, HiredDate is top level usually
                             "<IncludeRetElement>HiredDate</IncludeRetElement>" + 
                             "<IncludeRetElement>BirthDate</IncludeRetElement>" + 
                             "<IncludeRetElement>JobTitle</IncludeRetElement>" + 
                             "</EmployeeQueryRq></QBXMLMsgsRq></QBXML>";
                
                string responseXml = rp.ProcessRequest(ticket, xml);

                var employees = new List<Dictionary<string, object>>();
                
                // Helper to get safe text
                Func<XmlNode, string, string> GetVal = (n, tag) => {
                    var node = n.SelectSingleNode(tag);
                    return node?.InnerText ?? "";
                };

                // Helper for Address
                Func<XmlNode, string> GetAddr = (n) => {
                     var addr = n.SelectSingleNode("EmployeeAddress");
                     if (addr == null) return "";
                     /* Combine Addr1...Addr5, City, State, PostalCode */
                     var parts = new List<string>();
                     foreach(string t in new[]{"Addr1","Addr2","City","State","PostalCode"}) {
                         string v = GetVal(addr, t);
                         if (!string.IsNullOrEmpty(v)) parts.Add(v);
                     }
                     return string.Join(", ", parts);
                };

                XmlDocument doc = new XmlDocument();
                doc.LoadXml(responseXml);

                XmlNodeList employeeNodes = doc.GetElementsByTagName("EmployeeRet");
                foreach (XmlNode emp in employeeNodes)
                {
                    var e = new Dictionary<string, object>();
                    e["id"] = GetVal(emp, "ListID");
                    e["name"] = GetVal(emp, "Name");
                    e["is_active"] = GetVal(emp, "IsActive") == "true";
                    e["account_number"] = GetVal(emp, "AccountNumber");
                    e["email"] = GetVal(emp, "Email");
                    e["phone"] = GetVal(emp, "Phone");
                    e["hired_date"] = GetVal(emp, "HiredDate");
                    e["birth_date"] = GetVal(emp, "BirthDate");
                    
                    // "Job Title" in UI usually maps to JobTitle, but "Occupation" can be JobDesc
                    string jt = GetVal(emp, "JobTitle");
                    
                    // Fallback to Payroll Item Name (e.g. "Front Desk Wages") if Title/Desc is empty
                    if (string.IsNullOrEmpty(jt)) {
                         XmlNode payrollInfo = emp.SelectSingleNode("EmployeePayrollInfo");
                         if (payrollInfo != null) {
                             // Try to find ANY PayrollItem reference (Wage, Salary, etc)
                             // Usually in <Earnings><PayrollItemWageRef><FullName>...
                             // Or <Earnings><PayrollItemSalaryRef><FullName>...
                             foreach(string tag in new[] { "PayrollItemWageRef", "PayrollItemSalaryRef" }) {
                                 XmlNode refNode = payrollInfo.SelectSingleNode($"Earnings/{tag}/FullName");
                                 if (refNode != null) {
                                     jt = refNode.InnerText;
                                     // Clean up common suffixes like " Wages" or " Salary" to make it look like a Job Title?
                                     // User seemed fine with "Chef Wages", but maybe "Chef" is better.
                                     // Let's keep raw for now as user asked "would be ok to use that".
                                     break;
                                 }
                             }
                         }
                    }

                    e["job_title"] = jt;
                    
                    e["address"] = GetAddr(emp);
                    
                    // Parse Vacation & Sick Hours (PT format e.g. PT40H30M)
                    XmlNode payroll = emp.SelectSingleNode("EmployeePayrollInfo");
                    if (payroll != null) {
                        e["vacation_hours_available"] = ParseQBDuration(GetVal(payroll, "VacationHours/HoursAvailable"));
                        e["vacation_accrual_period"] = GetVal(payroll, "VacationHours/AccrualPeriod");
                        e["vacation_hours_accrued"] = ParseQBDuration(GetVal(payroll, "VacationHours/HoursAccrued"));
                        e["vacation_max_hours"] = ParseQBDuration(GetVal(payroll, "VacationHours/MaximumHours"));
                        e["vacation_reset_yearly"] = GetVal(payroll, "VacationHours/IsResettingHoursEachNewYear") == "true";
                        e["vacation_hours_used"] = ParseQBDuration(GetVal(payroll, "VacationHours/HoursUsed"));

                        e["sick_hours_available"] = ParseQBDuration(GetVal(payroll, "SickHours/HoursAvailable"));
                        e["sick_accrual_period"] = GetVal(payroll, "SickHours/AccrualPeriod");
                        e["sick_hours_accrued"] = ParseQBDuration(GetVal(payroll, "SickHours/HoursAccrued"));
                        e["sick_max_hours"] = ParseQBDuration(GetVal(payroll, "SickHours/MaximumHours"));
                        e["sick_reset_yearly"] = GetVal(payroll, "SickHours/IsResettingHoursEachNewYear") == "true";
                        e["sick_hours_used"] = ParseQBDuration(GetVal(payroll, "SickHours/HoursUsed"));
                    } else {
                         e["vacation_hours_available"] = 0;
                         e["vacation_accrual_period"] = "";
                         e["vacation_hours_accrued"] = 0;
                         e["vacation_max_hours"] = 0;
                         e["vacation_reset_yearly"] = false;
                         e["vacation_hours_used"] = 0;

                         e["sick_hours_available"] = 0;
                         e["sick_accrual_period"] = "";
                         e["sick_hours_accrued"] = 0;
                         e["sick_max_hours"] = 0;
                         e["sick_reset_yearly"] = false;
                         e["sick_hours_used"] = 0;
                    }

                    employees.Add(e);
                }

                return new { status = "ok", employees = employees };
            });
        }

        static object GetVacationReport()
        {
            return ProcessQBRequest("Fetching Vacation Report", (ticket, rp) => {
                // Request Payroll Summary for 2020-2026 to capture all balances
                // Helper to run query
                Func<string, string, List<object>> RunReport = (startDate, endDate) => {
                    string xml = "<?xml version=\"1.0\" ?><?qbxml version=\"13.0\"?><QBXML><QBXMLMsgsRq onError=\"continueOnError\">" + 
                                 "<PayrollSummaryReportQueryRq>" + 
                                 "<PayrollSummaryReportType>PayrollSummary</PayrollSummaryReportType>" +
                                 "<ReportPeriod><FromReportDate>" + startDate + "</FromReportDate><ToReportDate>" + endDate + "</ToReportDate></ReportPeriod>" + 
                                 "</PayrollSummaryReportQueryRq>" + 
                                 "</QBXMLMsgsRq></QBXML>";
                    
                    string responseXml = rp.ProcessRequest(ticket, xml);
                    var doc = new XmlDocument();
                    doc.LoadXml(responseXml);
                    
                    var reportData = new List<object>();
                    var colMap = new Dictionary<string, string>();
                    var colNodes = doc.SelectNodes("//ColDesc");
                    foreach (XmlNode col in colNodes) {
                        string colID = col.Attributes["colID"]?.Value;
                        string dType = col.Attributes["dataType"]?.Value; // Quantity, Price, Amount
                        var titleNodes = col.SelectNodes("ColTitle");
                        if (titleNodes.Count > 0) {
                            string empName = titleNodes[0].Attributes["value"]?.Value;
                            if (!string.IsNullOrEmpty(empName) && empName != "TOTAL") {
                                if (!colMap.ContainsKey(colID)) {
                                    // Suffix based on sub-header or type
                                    string suffix = "";
                                    
                                    // Check secondary titles (SubHeaders)
                                    bool matched = false;
                                    if (titleNodes.Count > 1) {
                                        string subHeader = titleNodes[1].Attributes["value"]?.Value; 
                                        if (subHeader == "Hours") { suffix = "_qty"; matched = true; }
                                        else if (subHeader == "Rate") { suffix = "_rate"; matched = true; }
                                    }
                                    
                                    // Fallback to DataType if SubHeader didn't match
                                    if (!matched) {
                                        if (dType == "Quantity") suffix = "_qty";
                                        else if (dType == "Price") suffix = "_rate";
                                        else if (dType == "Amount") suffix = "_amt";
                                        else suffix = "_amt"; // Default to Amount for safety (usually the 3rd col)
                                    }
                                    
                                    colMap.Add(colID, empName + suffix);
                                }
                            }
                        }
                    }
                    var dataRows = doc.SelectNodes("//DataRow");
                    foreach (XmlNode row in dataRows) {
                        string rowLabel = "";
                        var rowDataNode = row.SelectSingleNode("RowData");
                        if (rowDataNode != null) rowLabel = rowDataNode.Attributes["value"]?.Value;
                        if (string.IsNullOrEmpty(rowLabel)) continue;
                        var empValues = new Dictionary<string, string>();
                        var colDataNodes = row.SelectNodes("ColData");
                        foreach (XmlNode cell in colDataNodes) {
                            string cID = cell.Attributes["colID"]?.Value;
                            string val = cell.Attributes["value"]?.Value;
                            if (colMap.ContainsKey(cID)) empValues[colMap[cID]] = val;
                        }
                        reportData.Add(new { label = rowLabel, values = empValues });
                    }
                    return reportData;
                };

                // 1. All Time (for Balance)
                var rowsHistory = RunReport("2020-01-01", "2026-12-31");
                
                // 2. Current Year (for Usage)
                string curYear = DateTime.Now.Year.ToString();
                var rowsCurrent = RunReport(curYear + "-01-01", curYear + "-12-31");

                return new { status = "ok", rows = rowsHistory, rows_current = rowsCurrent, version = "1.1" };
            });
        }

        static object GetCompanyInfo()
        {
             return ProcessQBRequest("Get Company Info", (ticket, rp) => {
                string xml = "<?xml version=\"1.0\" ?><?qbxml version=\"13.0\"?><QBXML><QBXMLMsgsRq onError=\"stopOnError\"><CompanyQueryRq></CompanyQueryRq></QBXMLMsgsRq></QBXML>";
                string res = rp.ProcessRequest(ticket, xml);
                
                var doc = new XmlDocument();
                doc.LoadXml(res);
                
                // Helper internal to avoid scope issues
                Func<XmlNode, string, string> GetVal = (n, tag) => {
                    var node = n.SelectSingleNode(tag);
                    return node?.InnerText ?? "";
                };
                
                var root = doc.SelectSingleNode("//CompanyRet");
                string name = GetVal(root, "CompanyName");
                string legal = GetVal(root, "LegalCompanyName");
                
                return new { status = "ok", company_name = name, legal_name = legal };
             });
        }        
        
        // Helper: Parse ISO8601 Duration (PT12H30M) or hh:mm:ss or decimal -> Decimal Hours (12.5)
        static double ParseQBDuration(string ptStr)
        {
            if (string.IsNullOrEmpty(ptStr)) return 0;
            try {
                // Try format P[n]Y[n]M[n]DT[n]H[n]M[n]S (e.g. PTxxHxxMxxS)
                TimeSpan ts = System.Xml.XmlConvert.ToTimeSpan(ptStr);
                return ts.TotalHours;
            } catch {
                try {
                    // Try parsing as standard TimeSpan format (e.g., "16:00:00")
                    if (TimeSpan.TryParse(ptStr, out TimeSpan parsedTs)) {
                        return parsedTs.TotalHours;
                    }
                    // Try parsing as raw floating decimal (e.g., "16.00" or "16")
                    if (double.TryParse(ptStr, out double dVal)) {
                        return dVal;
                    }
                } catch {}
                
                return 0; // Final fallback
            }
        }

        static object ProcessQBRequest(string actionName, Func<string, dynamic, object> action)
        {
            dynamic rp = null;
            string ticket = null;
            try
            {
                // Robust ProgID Search
                string[] progIds = { "QBXMLRP2.RequestProcessor", "QBXMLRP2.RequestProcessor.2", "QBXMLRP2.RequestProcessor.1", "QBXMLRP.RequestProcessor" };
                Type rpType = null;
                foreach (var id in progIds) {
                    try {
                        rpType = Type.GetTypeFromProgID(id);
                        if (rpType != null) { 
                            Console.WriteLine($"[Debug] Found QB SDK Class: {id}");
                            break; 
                        }
                    } catch {}
                }

                if (rpType == null) return new { status = "error", message = "QB SDK not found. Checked: " + string.Join(", ", progIds) };

                // Stability Delay (Wait for COM subsystem)
                System.Threading.Thread.Sleep(3000);

                rp = Activator.CreateInstance(rpType);
                rp.OpenConnection("PTO-Integrator", "PTO Integrator");
                ticket = rp.BeginSession("", 2); // Multi-user

                return action(ticket, rp);
            }
            catch (Exception ex)
            {
                string msg = ex.Message;
                if (msg.Contains("company data file is not open"))
                {
                    msg += " (HINT: This usually means QuickBooks is running as a different user than this Connector. Try running BOTH as Administrator.)";
                }
                return new { status = "error", message = $"QB Error: {msg}" };
            }
            finally
            {
                try { 
                    if (ticket != null && rp != null) rp.EndSession(ticket); 
                    if (rp != null) rp.CloseConnection();
                } catch { }
                if (rp != null) Marshal.ReleaseComObject(rp);
            }
        }

        static string GetNodeText(XmlNode parent, string tagName)
        {
            if (parent == null) return "";
            XmlNode n = parent.SelectSingleNode(tagName);
            return n != null ? n.InnerText : "";
        }
    }
}
