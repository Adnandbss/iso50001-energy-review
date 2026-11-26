Option Explicit

' ============================================================================
'  SER PBI - Module1 corrige
'  Remplace integralement le contenu de Module1.
'  (Fichier volontairement sans accents pour eviter les problemes d'encodage
'   a l'import sur Mac comme sur Windows.)
'
'  Corrections par rapport a la version d'origine :
'   - plus de serie fantome (la colonne des dates n'est plus comptee comme
'     une consommation)
'   - consommation N-1 cherchee par DATE dans la meme serie (et non 365
'     lignes plus haut), valable au pas jour, semaine ou mois
'   - annee-semaine ISO correcte autour du nouvel an (ex. 30/12/2024 = 2025W01)
'   - en-tete "R2" ecrit en colonne 33
'   - WEEKLY TARGET rempli depuis la ligne 5 du WIKI
'   - ecart (SavingsREF) laisse vide quand la consommation est absente
'   - compteurs en Long (plus de plafond a 32 767 lignes)
'   - controle des noms entre CONSO / EQUATION / WIKI / FACTEURS INF
'   - ecriture en un seul bloc (beaucoup plus rapide)
' ============================================================================

Private Const NB_COL As Long = 33


' ----------------------------------------------------------------------------
'  TEMPLATE 2 : facteurs influents en colonnes DATE / NOM / VALEUR
' ----------------------------------------------------------------------------
Sub EcrireTemplate2()
    Dim wsF As Worksheet, wsT As Worksheet
    Dim nbLig As Long, nbCol As Long
    Dim v As Variant, out() As Variant
    Dim i As Long, j As Long, n As Long

    Set wsF = Feuille("FACTEURS INF")
    Set wsT = Feuille("TEMPLATE 2")
    If wsF Is Nothing Or wsT Is Nothing Then Exit Sub

    nbLig = wsF.Cells(wsF.Rows.Count, 1).End(xlUp).Row
    nbCol = wsF.Cells(1, wsF.Columns.Count).End(xlToLeft).Column
    If nbLig < 2 Or nbCol < 2 Then
        MsgBox "La feuille FACTEURS INF est vide.", vbExclamation
        Exit Sub
    End If

    v = wsF.Range(wsF.Cells(1, 1), wsF.Cells(nbLig, nbCol)).Value
    ReDim out(1 To (nbCol - 1) * (nbLig - 1), 1 To 3)
    n = 0
    For i = 2 To nbCol
        For j = 2 To nbLig
            n = n + 1
            out(n, 1) = v(j, 1)
            out(n, 2) = v(1, i)
            out(n, 3) = v(j, i)
        Next j
    Next i

    wsT.Cells.ClearContents
    wsT.Range("A1:C1").Value = Array("DATE", "NAME FACT. INF.", "VALUE FACT. INF")
    wsT.Range("A2").Resize(n, 3).Value = out

    MsgBox "TEMPLATE 2 mis a jour : " & n & " lignes.", vbInformation
End Sub


' ----------------------------------------------------------------------------
'  TEMPLATE : une ligne par date et par consommation
' ----------------------------------------------------------------------------
Sub EcrireTemplate()
    Dim wsC As Worksheet, wsF As Worksheet, wsE1 As Worksheet, wsE2 As Worksheet
    Dim wsW As Worksheet, wsT As Worksheet
    Dim vC As Variant, vF As Variant, vE1 As Variant, vE2 As Variant, vW As Variant
    Dim out() As Variant, headers As Variant
    Dim nbLig As Long, nbConso As Long, nbFact As Long
    Dim i As Long, j As Long, k As Long, n As Long, c As Long
    Dim d As Date, dF As Date
    Dim isoY As Long, isoW As Long
    Dim conso As Double, ref1 As Double, ref2 As Double, ref As Double
    Dim f As Double, ly As Double
    Dim saisonnier As Boolean, hasS1 As Boolean, hasS2 As Boolean
    Dim ete1 As Date, hiver1 As Date, ete2 As Date, hiver2 As Date
    Dim errM(1 To 4) As Double
    Dim lignes As Collection
    Dim alertes As String, nbDatesKo As Long

    Set wsC = Feuille("CONSO")
    Set wsF = Feuille("FACTEURS INF")
    Set wsE1 = Feuille("EQUATION")
    Set wsE2 = Feuille("EQUATION 2")
    Set wsW = Feuille("WIKI")
    Set wsT = Feuille("TEMPLATE")
    If wsC Is Nothing Or wsF Is Nothing Or wsE1 Is Nothing Then Exit Sub
    If wsE2 Is Nothing Or wsW Is Nothing Or wsT Is Nothing Then Exit Sub

    ' --- dimensions (la colonne A = dates, donc nb de consommations = colonnes - 1)
    nbLig = wsC.Cells(wsC.Rows.Count, 1).End(xlUp).Row
    nbConso = wsC.Cells(1, wsC.Columns.Count).End(xlToLeft).Column - 1
    nbFact = wsF.Cells(1, wsF.Columns.Count).End(xlToLeft).Column - 1
    If nbFact < 0 Then nbFact = 0
    If nbLig < 2 Or nbConso < 1 Then
        MsgBox "La feuille CONSO est vide.", vbExclamation
        Exit Sub
    End If

    On Error GoTo Echec
    Application.ScreenUpdating = False

    ' --- lecture de toutes les feuilles de saisie en memoire
    vC = wsC.Range(wsC.Cells(1, 1), wsC.Cells(nbLig, nbConso + 1)).Value
    vF = wsF.Range(wsF.Cells(1, 1), wsF.Cells(nbLig, nbFact + 2)).Value
    vE1 = wsE1.Range(wsE1.Cells(1, 1), wsE1.Cells(nbFact + 2, nbConso + 1)).Value
    vE2 = wsE2.Range(wsE2.Cells(1, 1), wsE2.Cells(nbFact + 2, nbConso + 1)).Value
    vW = wsW.Range(wsW.Cells(1, 1), wsW.Cells(15, nbConso + 1)).Value

    ' --- controles de coherence (le calcul se fait par position)
    alertes = ""
    For i = 1 To nbConso
        c = i + 1
        If Txt(vE1(1, c)) <> Txt(vC(1, c)) Then
            alertes = alertes & vbCrLf & "- EQUATION colonne " & c & " : '" & Txt(vE1(1, c)) & "' au lieu de '" & Txt(vC(1, c)) & "'"
        End If
        If Txt(vW(1, c)) <> Txt(vC(1, c)) Then
            alertes = alertes & vbCrLf & "- WIKI colonne " & c & " : '" & Txt(vW(1, c)) & "' au lieu de '" & Txt(vC(1, c)) & "'"
        End If
    Next i
    For k = 1 To nbFact
        If Txt(vE1(k + 2, 1)) <> Txt(vF(1, k + 1)) Then
            alertes = alertes & vbCrLf & "- EQUATION ligne " & (k + 2) & " : '" & Txt(vE1(k + 2, 1)) & "' au lieu de '" & Txt(vF(1, k + 1)) & "'"
        End If
    Next k
    nbDatesKo = 0
    For j = 2 To nbLig
        If ToDate(vC(j, 1), d) Then
            If ToDate(vF(j, 1), dF) Then
                If CLng(Int(CDbl(d))) <> CLng(Int(CDbl(dF))) Then nbDatesKo = nbDatesKo + 1
            Else
                nbDatesKo = nbDatesKo + 1
            End If
        End If
    Next j
    If nbDatesKo > 0 Then
        alertes = alertes & vbCrLf & "- " & nbDatesKo & " date(s) de FACTEURS INF differente(s) de CONSO"
    End If
    If Len(alertes) > 0 Then
        Application.ScreenUpdating = True
        If MsgBox("Incoherences detectees :" & alertes & vbCrLf & vbCrLf & "Continuer quand meme ?", vbExclamation + vbYesNo, "Controle avant ecriture") = vbNo Then
            Exit Sub
        End If
        Application.ScreenUpdating = False
    End If

    ' --- index date -> ligne de CONSO (pour retrouver la consommation N-1)
    Set lignes = New Collection
    On Error Resume Next
    For j = 2 To nbLig
        If ToDate(vC(j, 1), d) Then lignes.Add j, CStr(CLng(Int(CDbl(d))))
    Next j
    On Error GoTo Echec

    headers = Array("YEAR", "MONTH", "DAY WEEK", "WEEK", "DAY", "ENERGY TYPE", "LEVEL", _
        "YEAR MONTH", "YEAR WEEK", "DATE", "NAME", "CONSUMPTION Wh", "CONSUMPTION Wh REF.", _
        "CONSUMPTION Wh LAST YEAR", "ASSET", "WEEKLY TARGET", "ERR MODELE DAY", _
        "ERR MODELE WEEK", "ERR MODELE MONTH", "ERR MODELE YEAR", "TYPE DE MODELE", _
        "SavingsREF Wh.", "ERR DAY+", "ERR DAY-", "ERR WEEK+", "ERR WEEK-", "ERR MONTH+", _
        "ERR MONTH-", "ERR YEAR+", "ERR YEAR-", "ERR GAZ & ELEC+", "ERR GAZ & ELEC-", _
        "R" & ChrW(178))

    ReDim out(1 To nbConso * (nbLig - 1), 1 To NB_COL)
    n = 0

    For i = 1 To nbConso
        c = i + 1

        ' caracteristiques de la consommation (WIKI)
        saisonnier = (LCase$(Txt(vW(10, c))) = "saisonnier")
        hasS1 = False
        If ToDate(vW(11, c), ete1) Then
            If ToDate(vW(12, c), hiver1) Then hasS1 = True
        End If
        hasS2 = False
        If ToDate(vW(13, c), ete2) Then
            If ToDate(vW(14, c), hiver2) Then hasS2 = True
        End If
        For k = 1 To 4
            errM(k) = Num(vW(5 + k, c))      ' lignes 6 a 9 : erreur jour / semaine / mois / an
        Next k

        For j = 2 To nbLig
            If ToDate(vC(j, 1), d) Then
                d = CDate(Int(CDbl(d)))
                n = n + 1
                isoW = IsoWeek(d, isoY)

                out(n, 1) = Year(d)
                out(n, 2) = Month(d)
                out(n, 3) = Weekday(d)
                out(n, 4) = isoW
                out(n, 5) = Day(d)
                out(n, 6) = vW(2, c)
                out(n, 7) = vW(3, c)
                out(n, 8) = DateSerial(Year(d), Month(d), 1)
                out(n, 9) = isoY & "W" & Format$(isoW, "00")
                out(n, 10) = d
                out(n, 11) = vC(1, c)

                ' consommation reelle : kWh -> Wh (0 ou vide = pas de donnee)
                conso = Num(vC(j, c)) * 1000#
                If conso <> 0 Then
                    out(n, 12) = conso

                    ' consommation modelisee = base + somme(coefficient x facteur)
                    ref1 = Num(vE1(2, c))
                    ref2 = Num(vE2(2, c))
                    For k = 1 To nbFact
                        f = Num(vF(j, k + 1))
                        ref1 = ref1 + f * Num(vE1(k + 2, c))
                        ref2 = ref2 + f * Num(vE2(k + 2, c))
                    Next k

                    ref = ref1
                    If saisonnier Then
                        If hasS1 Then
                            If d >= ete1 And d <= hiver1 Then ref = ref2
                        End If
                        If hasS2 Then
                            If d >= ete2 And d <= hiver2 Then ref = ref2
                        End If
                    End If
                    ref = ref * 1000#

                    out(n, 13) = ref
                    out(n, 22) = conso - ref

                    ' tunnel d'erreur : jour (23-24), semaine (25-26), mois (27-28), an (29-30)
                    For k = 1 To 4
                        out(n, 21 + 2 * k) = ref * (1 + errM(k))
                        out(n, 22 + 2 * k) = ref * (1 - errM(k))
                    Next k

                    ' consommation de l'an dernier, meme serie
                    ly = ConsoAnPrecedent(vC, lignes, d, c)
                    If ly <> 0 Then out(n, 14) = ly * 1000#
                End If

                out(n, 15) = vW(4, c)
                If Not IsEmpty(vW(5, c)) Then
                    If IsNumeric(vW(5, c)) Then out(n, 16) = vW(5, c)
                End If
                out(n, 17) = errM(1)
                out(n, 18) = errM(2)
                out(n, 19) = errM(3)
                out(n, 20) = errM(4)
                out(n, 21) = vW(10, c)
                out(n, 33) = vW(15, c)
            End If
        Next j
    Next i

    ' --- ecriture en un seul bloc
    wsT.Cells.ClearContents
    wsT.Range(wsT.Cells(1, 1), wsT.Cells(1, NB_COL)).Value = headers
    If n > 0 Then wsT.Range("A2").Resize(n, NB_COL).Value = out

    Application.ScreenUpdating = True
    MsgBox "TEMPLATE mis a jour : " & n & " lignes (" & nbConso & " consommations).", vbInformation
    Exit Sub

Echec:
    Application.ScreenUpdating = True
    MsgBox "Erreur " & Err.Number & " : " & Err.Description, vbCritical, "EcrireTemplate"
End Sub


' ----------------------------------------------------------------------------
'  Fonctions utilitaires
' ----------------------------------------------------------------------------

' Renvoie la feuille demandee, ou Nothing (avec un message) si elle n'existe pas.
Private Function Feuille(ByVal nom As String) As Worksheet
    On Error Resume Next
    Set Feuille = ThisWorkbook.Sheets(nom)
    On Error GoTo 0
    If Feuille Is Nothing Then MsgBox "Feuille introuvable : " & nom, vbExclamation
End Function

' Valeur numerique d'une cellule ; 0 si vide, texte ou erreur.
Private Function Num(ByVal v As Variant) As Double
    Num = 0
    If IsError(v) Then Exit Function
    If IsEmpty(v) Then Exit Function
    If VarType(v) = vbDate Then Exit Function
    If IsNumeric(v) Then Num = CDbl(v)
End Function

' Texte d'une cellule, sans espaces autour ; "" si vide ou erreur.
Private Function Txt(ByVal v As Variant) As String
    Txt = ""
    If IsError(v) Then Exit Function
    If IsEmpty(v) Then Exit Function
    Txt = Trim$(CStr(v))
End Function

' Convertit une cellule en date. Renvoie False si ce n'est pas une date.
Private Function ToDate(ByVal v As Variant, ByRef d As Date) As Boolean
    ToDate = False
    If IsError(v) Then Exit Function
    If IsEmpty(v) Then Exit Function
    If VarType(v) = vbDate Then
        d = v
        ToDate = True
    ElseIf VarType(v) = vbString Then
        If IsDate(v) Then
            d = CDate(v)
            ToDate = True
        End If
    ElseIf IsNumeric(v) Then
        If CDbl(v) >= 1 Then
            d = CDate(CDbl(v))
            ToDate = True
        End If
    End If
End Function

' Numero de semaine ISO 8601 (lundi = 1er jour, semaine 1 = celle du 1er jeudi).
' isoYear recoit l'annee a laquelle la semaine appartient.
Private Function IsoWeek(ByVal d As Date, ByRef isoYear As Long) As Long
    Dim jeudi As Date
    jeudi = d - Weekday(d, vbMonday) + 4
    isoYear = Year(jeudi)
    IsoWeek = (DateDiff("d", DateSerial(isoYear, 1, 1), jeudi) \ 7) + 1
End Function

' Ligne de CONSO correspondant a une date (numero de serie), 0 si absente.
Private Function LigneDeDate(ByVal lignes As Collection, ByVal serie As Long) As Long
    LigneDeDate = 0
    On Error Resume Next
    LigneDeDate = lignes(CStr(serie))
    On Error GoTo 0
End Function

' Consommation (kWh) de la meme serie un an plus tot.
' Cherche la meme date l'an dernier, sinon la date renseignee la plus proche
' a +/- 3 jours (necessaire au pas hebdomadaire, ou le jour de semaine decale).
Private Function ConsoAnPrecedent(ByRef vC As Variant, ByVal lignes As Collection, ByVal d As Date, ByVal c As Long) As Double
    Dim cible As Long, r As Long, e As Variant, v As Double
    ConsoAnPrecedent = 0
    cible = CLng(Int(CDbl(DateAdd("yyyy", -1, d))))
    For Each e In Array(0, 1, -1, 2, -2, 3, -3)
        r = LigneDeDate(lignes, cible + CLng(e))
        If r > 0 Then
            v = Num(vC(r, c))
            If v <> 0 Then
                ConsoAnPrecedent = v
                Exit Function
            End If
        End If
    Next e
End Function
