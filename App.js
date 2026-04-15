import React, { useState } from "react";
import { StyleSheet, View, ScrollView, StatusBar } from "react-native";
import { Provider as PaperProvider, Surface, Text, Button } from "react-native-paper";

// ─────────────────────────────────────────────
//  Mapeamento numérico → hieróglifo
// ─────────────────────────────────────────────
const GLYPH = {
  "0": "𓏺", "1": "𓏻", "2": "𓏼", "3": "𓏽", "4": "𓏾",
  "5": "𓏿", "6": "𓐀", "7": "𓐁", "8": "𓐂", "9": "𓐃",
  ".": "𓅱", "-": "⁻",
};

const OP_GLYPH = { "+": "𓆓", "-": "𓌀", "*": "𓌀", "/": "𓊃" };

function toGlyph(str) {
  return String(str)
    .split("")
    .map((c) => GLYPH[c] ?? c)
    .join("");
}

// ─────────────────────────────────────────────
//  Layout dos botões
// ─────────────────────────────────────────────
const BUTTONS = [
  [
    { label: "AC",  glyph: "𓂀", type: "fn",  action: "clear"   },
    { label: "+/-", glyph: "𓇯", type: "fn",  action: "sign"    },
    { label: "%",   glyph: "𓏦", type: "fn",  action: "percent" },
    { label: "÷",   glyph: "𓊃", type: "op",  action: "op", val: "/" },
  ],
  [
    { label: "7", glyph: "𓐁", type: "num", action: "num", val: "7" },
    { label: "8", glyph: "𓐂", type: "num", action: "num", val: "8" },
    { label: "9", glyph: "𓐃", type: "num", action: "num", val: "9" },
    { label: "×", glyph: "𓌀", type: "op",  action: "op",  val: "*" },
  ],
  [
    { label: "4", glyph: "𓏾", type: "num", action: "num", val: "4" },
    { label: "5", glyph: "𓏿", type: "num", action: "num", val: "5" },
    { label: "6", glyph: "𓐀", type: "num", action: "num", val: "6" },
    { label: "−", glyph: "𓌀", type: "op",  action: "op",  val: "-" },
  ],
  [
    { label: "1", glyph: "𓏻", type: "num", action: "num", val: "1" },
    { label: "2", glyph: "𓏼", type: "num", action: "num", val: "2" },
    { label: "3", glyph: "𓏽", type: "num", action: "num", val: "3" },
    { label: "+", glyph: "𓆓", type: "op",  action: "op",  val: "+" },
  ],
  [
    { label: "0", glyph: "𓏺", type: "num", action: "num", val: "0", wide: true },
    { label: ".", glyph: "𓅱", type: "num", action: "dot" },
    { label: "=", glyph: "𓂋", type: "eq",  action: "equal" },
  ],
];

// ─────────────────────────────────────────────
//  Componente Botão
// ─────────────────────────────────────────────
function CalcButton({ item, onPress }) {
  const bgColor =
    item.type === "op" ? "#c8963e"
    : item.type === "eq" ? "#e8d5a3"
    : item.type === "fn" ? "#2a2a4a"
    : "#252540";

  const textColor =
    item.type === "eq" ? "#1a1a2e"
    : item.type === "op" ? "#1a1a2e"
    : "#e8d5a3";

  return (
    <Surface
      style={[
        styles.btnSurface,
        item.wide && styles.btnWide,
        { backgroundColor: bgColor },
      ]}
      elevation={2}
    >
      <Button
        onPress={() => onPress(item)}
        style={styles.btnInner}
        contentStyle={styles.btnContent}
        labelStyle={[styles.btnLabel, { color: "transparent" }]}
      >
        {/* Hieróglifo principal */}
        <Text style={[styles.btnGlyph, { color: textColor }]}>{item.glyph}</Text>
        {/* Legenda romana abaixo */}
        <Text style={[styles.btnHint, { color: textColor }]}>{item.label}</Text>
      </Button>
    </Surface>
  );
}

// ─────────────────────────────────────────────
//  App Principal
// ─────────────────────────────────────────────
export default function App() {
  const [current, setCurrent] = useState("0");
  const [previous, setPrevious] = useState("");
  const [operator, setOperator] = useState(null);
  const [shouldReset, setShouldReset] = useState(false);
  const [expression, setExpression] = useState("");

  function compute(a, b, op) {
    const fa = parseFloat(a);
    const fb = parseFloat(b);
    switch (op) {
      case "+": return fa + fb;
      case "-": return fa - fb;
      case "*": return fa * fb;
      case "/": return fb === 0 ? null : fa / fb;
      default:  return fb;
    }
  }

  function handle(item) {
    switch (item.action) {
      case "num": {
        if (shouldReset || current === "0") {
          setCurrent(item.val);
          setShouldReset(false);
        } else {
          if (current.length < 12) setCurrent(current + item.val);
        }
        break;
      }
      case "dot": {
        if (shouldReset) {
          setCurrent("0.");
          setShouldReset(false);
        } else if (!current.includes(".")) {
          setCurrent(current + ".");
        }
        break;
      }
      case "op": {
        if (operator && !shouldReset) {
          const result = compute(previous, current, operator);
          if (result === null) {
            setCurrent("0");
            setPrevious("");
            setOperator(null);
            setExpression("𓂀 Erro 𓂀");
            setShouldReset(false);
            return;
          }
          const res = parseFloat(result.toFixed(8)).toString();
          setCurrent(res);
          setPrevious(res);
          setExpression(toGlyph(res) + " " + OP_GLYPH[item.val]);
        } else {
          setPrevious(current);
          setExpression(toGlyph(current) + " " + OP_GLYPH[item.val]);
        }
        setOperator(item.val);
        setShouldReset(true);
        break;
      }
      case "equal": {
        if (!operator) return;
        const result = compute(previous, current, operator);
        if (result === null) {
          setExpression("𓂀 Divisão por zero 𓂀");
          setCurrent("0");
          setOperator(null);
          setShouldReset(false);
          return;
        }
        const res = parseFloat(result.toFixed(8)).toString();
        setExpression(
          toGlyph(previous) + " " + OP_GLYPH[operator] + " " + toGlyph(current) + " 𓂋"
        );
        setCurrent(res);
        setOperator(null);
        setShouldReset(true);
        break;
      }
      case "clear": {
        setCurrent("0");
        setPrevious("");
        setOperator(null);
        setShouldReset(false);
        setExpression("");
        break;
      }
      case "sign": {
        setCurrent(
          current.startsWith("-") ? current.slice(1) : "-" + current
        );
        break;
      }
      case "percent": {
        setCurrent(parseFloat((parseFloat(current) / 100).toFixed(10)).toString());
        break;
      }
    }
  }

  return (
    <PaperProvider>
      <StatusBar barStyle="light-content" backgroundColor="#0d0d1a" />
      <View style={styles.root}>
        {/* ── Display ── */}
        <Surface style={styles.displaySurface} elevation={4}>
          <Text style={styles.exprText}>{expression}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.displayScroll}
          >
            <Text style={styles.displayText} numberOfLines={1} adjustsFontSizeToFit>
              {toGlyph(current)}
            </Text>
          </ScrollView>
          <Text style={styles.displayHint}>{current}</Text>
        </Surface>

        {/* ── Teclado ── */}
        <View style={styles.keyboard}>
          {BUTTONS.map((row, ri) => (
            <View key={ri} style={styles.row}>
              {row.map((item, ci) => (
                <CalcButton key={ci} item={item} onPress={handle} />
              ))}
            </View>
          ))}
        </View>

        {/* ── Rodapé ── */}
        <Text style={styles.footer}>𓂀 Calculadora dos Faraós 𓂀</Text>
      </View>
    </PaperProvider>
  );
}

// ─────────────────────────────────────────────
//  Estilos
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0d0d1a",
    paddingTop: 56,
    paddingHorizontal: 12,
    paddingBottom: 16,
  },

  // Display
  displaySurface: {
    backgroundColor: "#141428",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    minHeight: 140,
    justifyContent: "flex-end",
  },
  exprText: {
    color: "#7a6a4a",
    fontSize: 16,
    textAlign: "right",
    minHeight: 22,
    letterSpacing: 2,
  },
  displayScroll: {
    flexGrow: 1,
    justifyContent: "flex-end",
  },
  displayText: {
    color: "#e8d5a3",
    fontSize: 52,
    textAlign: "right",
    letterSpacing: 4,
  },
  displayHint: {
    color: "#4a4a6a",
    fontSize: 13,
    textAlign: "right",
    marginTop: 4,
  },

  // Teclado
  keyboard: {
    flex: 1,
    gap: 10,
  },
  row: {
    flex: 1,
    flexDirection: "row",
    gap: 10,
  },

  // Botão
  btnSurface: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
  },
  btnWide: {
    flex: 2,
  },
  btnInner: {
    flex: 1,
    height: "100%",
    borderRadius: 16,
  },
  btnContent: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    paddingVertical: 8,
  },
  btnGlyph: {
    fontSize: 26,
    lineHeight: 32,
  },
  btnHint: {
    fontSize: 10,
    opacity: 0.65,
    marginTop: 2,
  },
  btnLabel: {
    fontSize: 0,
  },

  // Rodapé
  footer: {
    color: "#4a4a6a",
    textAlign: "center",
    fontSize: 12,
    marginTop: 12,
    letterSpacing: 2,
  },
});
