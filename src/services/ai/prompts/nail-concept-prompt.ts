export interface NailConceptPromptInput {
  requirementText: string;
  adjustmentText?: string;
  styles: string[];
  nailShapes: string[];
  inspirationSummaries: string[];
  materials: string[];
}

function list(title: string, values: string[]) {
  return values.length ? `${title}:\n${values.map((value) => `- ${value}`).join("\n")}` : "";
}

export function buildNailConceptPrompt(input: NailConceptPromptInput) {
  return [
    "Create a professional press-on nail tip concept design for practical nail art production.",
    "Show press-on nail tips only: exactly ten isolated, complete nail tips arranged as exactly 2 clean rows of 5, representing a cohesive left-hand and right-hand collection. The total count must equal 10, and each nail tip must appear once only.",
    "The design should be elegant, wearable, professionally presented, and realistic in press-on nail proportions.",
    "Composition requirements: a single continuous studio background, clean studio presentation, centered composition, full nail tips fully visible, no cropped nail edges, no hidden nail tips, consistent scale, clear separation between every nail tip, and no overlap that prevents inspection.",
    input.styles.length ? `Style: ${input.styles.join(", ")}.` : "",
    input.nailShapes.length ? `Nail shape: ${input.nailShapes.join(", ")}. Keep the shape consistent unless the request explicitly says otherwise.` : "",
    list("Inspiration direction", input.inspirationSummaries),
    input.materials.length ? `${list("Available materials", input.materials)}\nPrefer materials from this list when suitable, but do not force every material into the design.` : "",
    input.requirementText.trim() ? `User requirements:\n${input.requirementText.trim()}` : "",
    input.adjustmentText?.trim() ? `Revision request:\n${input.adjustmentText.trim()}\nPreserve the established design direction while applying this revision.` : "",
    "Do not show hands, fingers, knuckles, skin, wrists, or any human hand anatomy. Do not crop nails. Do not create malformed nail tips, extra nail tips, missing nails, repeated or duplicated nail tips, distorted nail shapes, random jewelry unless requested, or irrelevant background objects. Do not create a collage, split image, multiple panels, or panel seams.",
    "Final result: one clear studio image containing the complete ten-piece press-on nail collection, suitable as a visual reference for actual nail production.",
  ].filter(Boolean).join("\n\n");
}
