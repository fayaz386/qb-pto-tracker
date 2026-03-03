using System.Diagnostics;
using System.Runtime.InteropServices;

// 1. Start the Node.js Server
Console.WriteLine("Starting PTO Tracker Server...");

var processInfo = new ProcessStartInfo
{
    FileName = "node",
    Arguments = "server.js",
    UseShellExecute = false, 
    RedirectStandardOutput = true,
    RedirectStandardError = true,
    CreateNoWindow = false,
    WorkingDirectory = Directory.GetCurrentDirectory() // Assume EXE is in root or we adjust
};

// If running from inside 'Launcher/bin/...', we might need to go up levels.
// But we will publish it to the root.
// Let's check for server.js
if (!File.Exists("server.js"))
{
    Console.ForegroundColor = ConsoleColor.Red;
    Console.WriteLine("Error: server.js not found in current directory.");
    Console.WriteLine("Please ensure the PTOTracker.exe is in the same folder as server.js");
    Console.ResetColor();
    Console.WriteLine("Press any key to exit...");
    Console.ReadKey();
    return;
}

try
{
    using var serverProcess = new Process();
    serverProcess.StartInfo = processInfo;
    
    serverProcess.OutputDataReceived += (sender, e) => 
    {
        if (!string.IsNullOrEmpty(e.Data)) Console.WriteLine("[Server] " + e.Data);
    };
    serverProcess.ErrorDataReceived += (sender, e) => 
    {
        if (!string.IsNullOrEmpty(e.Data)) Console.WriteLine("[Error] " + e.Data);
    };

    serverProcess.Start();
    serverProcess.BeginOutputReadLine();
    serverProcess.BeginErrorReadLine();

    // 2. Determine Protocol
    string protocol = File.Exists("server.pfx") ? "https" : "http";
    string url = $"{protocol}://localhost:8085";

    Console.WriteLine($"Server started. Opening browser ({url})...");

    // 3. Open Browser after a short delay
    Thread.Sleep(3000); 
    OpenUrl(url);

    Console.WriteLine("Press 'q' to stop server and exit.");
    
    while (true)
    {
        var key = Console.ReadKey(true);
        if (key.KeyChar == 'q') break;
    }

    // Cleanup
    if (!serverProcess.HasExited)
    {
        serverProcess.Kill();
    }
}
catch (Exception ex)
{
    Console.WriteLine("Failed to start server: " + ex.Message);
    Console.ReadKey();
}

static void OpenUrl(string url)
{
    try
    {
        Process.Start(new ProcessStartInfo(url) { UseShellExecute = true });
    }
    catch
    {
        // Hack for cross-platform (though this is Windows focused)
        if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
        {
            url = url.Replace("&", "^&");
            Process.Start(new ProcessStartInfo("cmd", $"/c start {url}") { CreateNoWindow = true });
        }
    }
}
