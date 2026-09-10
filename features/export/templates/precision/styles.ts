import { Font, StyleSheet } from "@react-pdf/renderer";
import path from "node:path";

Font.register({
  family: "Instrument Sans",
  fonts: [
    { src: path.join(process.cwd(), "public/fonts/InstrumentSans-Regular.ttf"), fontWeight: 400 },
    { src: path.join(process.cwd(), "public/fonts/InstrumentSans-SemiBold.ttf"), fontWeight: 600 },
  ],
});

export const styles = StyleSheet.create({
  page: {
    fontFamily: "Instrument Sans",
    fontSize: 10,
    lineHeight: 1.45,
    padding: "20mm",
    color: "#15181B",
  },
  name: {
    fontSize: 18,
    fontWeight: 600,
    marginBottom: 2,
  },
  contactLine: {
    fontSize: 9,
    color: "#333333",
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 10,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 12,
    marginBottom: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: "#DEE2DE",
    paddingBottom: 3,
  },
  summary: {
    marginBottom: 4,
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  entryTitle: {
    fontWeight: 600,
  },
  entryDates: {
    fontSize: 9,
    color: "#333333",
  },
  entrySubtitle: {
    fontSize: 9,
    color: "#333333",
    marginBottom: 2,
  },
  bulletRow: {
    flexDirection: "row",
    marginBottom: 1,
  },
  bulletMarker: {
    width: 10,
  },
  bulletText: {
    flex: 1,
  },
  block: {
    marginBottom: 6,
  },
  skillLine: {
    marginBottom: 2,
  },
});
