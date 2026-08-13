from orchestrator import BlenderOrchestrator

def run_blender_pipeline(payload: dict, output_blend: str = "output.blend", output_glb: str = "output.glb"):
    orchestrator = BlenderOrchestrator(payload, output_blend, output_glb)
    return orchestrator.run()
