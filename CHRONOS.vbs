' Odpala chronos.py bez okna konsoli.

Option Explicit

Dim sh, fso, here, script, cmd, rc

Set sh  = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

here   = fso.GetParentFolderName(WScript.ScriptFullName)
script = here & "\chronos.py"

If Not fso.FileExists(script) Then
    MsgBox "Brak pliku chronos.py obok tego skrotu." & vbCrLf & vbCrLf & _
           "Szukalem tutaj:" & vbCrLf & script, 16, "CHRONOS"
    WScript.Quit 1
End If

sh.CurrentDirectory = here

' pythonw.exe = Python bez okna konsoli
On Error Resume Next
rc = sh.Run("pythonw.exe """ & script & """", 0, False)

If Err.Number <> 0 Then
    Err.Clear
    ' zapasowo zwykly python (mignie konsola, ale zadziala)
    rc = sh.Run("python.exe """ & script & """", 0, False)
    If Err.Number <> 0 Then
        MsgBox "Nie znaleziono Pythona." & vbCrLf & vbCrLf & _
               "CHRONOS potrzebuje Pythona 3 w PATH." & vbCrLf & _
               "Pobierz z python.org i zaznacz ""Add Python to PATH"".", _
               16, "CHRONOS"
        WScript.Quit 1
    End If
End If
On Error GoTo 0
