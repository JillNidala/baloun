#!/usr/bin/env python3
"""
BALOUN — controlli automatici sul database.

Prende i tipi di errore che ci sono già costati tempo e li intercetta
PRIMA di incollare lo script in Supabase.

Uso:  python3 supabase/verifica.py
Serve:  pip install pglast --break-system-packages
"""

import re
import sys
from pathlib import Path

CARTELLA = Path(__file__).parent
FILE_SQL = ['schema.sql', 'seed.sql', 'prepara-prove.sql', 'collega-profili.sql']

errori: list[str] = []
avvisi: list[str] = []


def senza_commenti(sql: str) -> str:
    """Toglie le righe commentate: non vengono eseguite, non vanno analizzate."""
    fuori = []
    for riga in sql.split('\n'):
        senza = re.sub(r'--.*$', '', riga)
        fuori.append(senza)
    return '\n'.join(fuori)


def sintassi(nome: str, sql: str) -> None:
    """Il parser ufficiale di PostgreSQL. Non risolve i nomi, solo la forma."""
    try:
        import pglast
        n = len(pglast.parse_sql(sql))
        print(f"  sintassi: {n} istruzioni valide")
    except ImportError:
        avvisi.append('pglast non installato: salto il controllo di sintassi')
    except Exception as e:
        errori.append(f'{nome}: sintassi non valida — {e}')


def ordine_tabelle(nome: str, sql: str) -> None:
    """Una funzione non può citare una tabella creata dopo di lei."""
    tabelle = {m.group(1): m.start()
               for m in re.finditer(r'create table if not exists public\.(\w+)', sql)}
    for m in re.finditer(r'create or replace function public\.(\w+)', sql):
        fine = sql.find('$$;', m.start())
        corpo = sql[m.start():fine if fine > 0 else m.start() + 4000]
        for t in set(re.findall(r'public\.(\w+)', corpo)):
            if t in tabelle and tabelle[t] > m.start():
                errori.append(f'{nome}: la funzione {m.group(1)}() usa {t}, creata dopo')


def ordine_policy(nome: str, sql: str) -> None:
    """Stessa regola per le policy."""
    tabelle = {m.group(1): m.start()
               for m in re.finditer(r'create table if not exists public\.(\w+)', sql)}
    for m in re.finditer(r'create policy (\w+) on ([\w.]+)', sql):
        fine = sql.find(';', m.start())
        for t in set(re.findall(r'public\.(\w+)', sql[m.start():fine])):
            if t in tabelle and tabelle[t] > m.start():
                errori.append(f'{nome}: la policy {m.group(1)} usa {t}, creata dopo')


def collisioni_variabili(nome: str, sql: str) -> None:
    """Una variabile plpgsql con lo stesso nome di una colonna crea ambiguità."""
    colonne = set()
    for blocco in re.findall(r'create table if not exists public\.\w+ \((.*?)\n\);', sql, re.S):
        for riga in blocco.split('\n'):
            m = re.match(r'\s+(\w+)\s+(uuid|text|int|boolean|date|timestamptz|jsonb|public\.)', riga)
            if m:
                colonne.add(m.group(1))

    for m in re.finditer(r'function public\.(\w+)\([^)]*\)\s*returns[\s\S]{0,80}?language plpgsql[\s\S]{0,200}?declare(.*?)begin', sql, re.S):
        for riga in m.group(2).split('\n'):
            v = re.match(r'\s+(\w+)\s+(?:constant\s+)?(?:int|text|uuid|boolean|record)', riga)
            if v and v.group(1) in colonne:
                errori.append(
                    f'{nome}: in {m.group(1)}() la variabile "{v.group(1)}" '
                    f'ha lo stesso nome di una colonna'
                )


def alias_prima_delluso(nome: str, sql: str) -> None:
    """Un alias va unito prima di essere usato in una condizione di join."""
    for m in re.finditer(r'\bfrom\b[\s\S]{0,900}?;', sql, re.I):
        blocco = m.group(0)
        if 'cross join' not in blocco:
            continue
        i_join = blocco.lower().find('cross join')
        for uso in re.finditer(r'\bjoin\b[^\n]*?\bme\.', blocco, re.I):
            if uso.start() < i_join:
                errori.append(f'{nome}: alias "me" usato prima del suo cross join')
                break


def segnaposto(nome: str, sql: str) -> None:
    """Placeholder dimenticati."""
    for testo in ['TUA-EMAIL', 'esempio.com', 'INSERISCI', 'TODO']:
        if testo in sql and not sql[max(0, sql.find(testo) - 3):sql.find(testo)].strip().startswith('--'):
            avvisi.append(f'{nome}: contiene ancora "{testo}"')


def main() -> int:
    print('BALOUN — controlli sul database\n')
    for nome in FILE_SQL:
        percorso = CARTELLA / nome
        if not percorso.exists():
            continue
        sql = percorso.read_text()
        vivo = senza_commenti(sql)   # solo il codice che verrà eseguito
        print(f'{nome}')
        sintassi(nome, sql)
        ordine_tabelle(nome, vivo)
        ordine_policy(nome, vivo)
        collisioni_variabili(nome, vivo)
        alias_prima_delluso(nome, vivo)
        segnaposto(nome, sql)
        print()

    if avvisi:
        print('AVVISI')
        for a in avvisi:
            print(f'  · {a}')
        print()

    if errori:
        print('ERRORI DA CORREGGERE')
        for e in errori:
            print(f'  ✗ {e}')
        return 1

    print('Nessun errore: si può incollare in Supabase.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
