Set oShell = CreateObject("WScript.Shell")
strPath = Left(WScript.ScriptFullName, InStrRev(WScript.ScriptFullName, "\"))
oShell.Run Chr(34) & strPath & "roni.exe" & Chr(34), 0, False