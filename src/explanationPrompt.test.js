import {SIMPDE_EXPLANATION_PROMPT} from "./explanationPrompt";
import {combinedClipboardText} from "./SettingsBox";

describe("copyable SimPDE guide", () => {
    test("documents the distinct languages and core editing contracts", () => {
        expect(SIMPDE_EXPLANATION_PROMPT.length).toBeGreaterThan(8000);
        expect(SIMPDE_EXPLANATION_PROMPT).toContain("STRING CONTAINING JAVASCRIPT");
        expect(SIMPDE_EXPLANATION_PROMPT).toContain("STRING CONTAINING GLSL ES 3.00 STATEMENTS");
        expect(SIMPDE_EXPLANATION_PROMPT).toContain("valueDimensions is the number N of scalar fields");
        expect(SIMPDE_EXPLANATION_PROMPT).toContain("boundaryCondition");
        expect(SIMPDE_EXPLANATION_PROMPT).toContain("APPLICATION CONFIGURATION REFERENCE");
    });

    test("labels combined clipboard sections unambiguously", () => {
        expect(combinedClipboardText([
            {heading: "SETTINGS", content: "{}"},
            {heading: "PROMPT", content: "Guide"}
        ])).toBe("SETTINGS\n\n{}\n\n---\n\nPROMPT\n\nGuide");
    });
});
