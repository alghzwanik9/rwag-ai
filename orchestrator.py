import json
import os
import sys
import subprocess
from blender_generator import BlenderCodeGenerator

# Configuration
SCHEMA_PATH = "schema.json"
GENERATED_SCRIPT_PATH = "generated_blender_script.py"
MAX_RETRIES = 2
BLENDER_EXECUTABLE = os.getenv("BLENDER_EXECUTABLE", "blender")

class BlenderOrchestrator:
    def __init__(self, payload: dict, output_blend: str = "output.blend", output_glb: str = "output.glb"):
        self.payload = payload
        self.output_blend = os.path.abspath(output_blend)
        self.output_glb = os.path.abspath(output_glb)
        self.state = {}
        self.current_stage = 1

    def validate_state(self):
        """Validates the state against constraints, enforcing t_y == 0."""
        objects = self.state.get("objects", [])
        for obj in objects:
            transform = obj.get("transform", {})
            if transform.get("t_y", None) != 0:
                raise ValueError(f"Geometry constraint violated: t_y MUST be 0 for object {obj.get('id')}")
        return True

    def execute_stage(self, stage: int):
        print(f"Executing Stage {stage}...")
        
        # When reaching stage 5, generate the blender code and execute
        if stage == 5:
            print("Generating Blender Python code...")
            generator = BlenderCodeGenerator(self.state, self.output_blend, self.output_glb)
            blender_code = generator.generate()
            
            with open(GENERATED_SCRIPT_PATH, "w") as f:
                f.write(blender_code)
                
            print(f"Executing Blender in background mode with {GENERATED_SCRIPT_PATH}...")
            if not os.path.exists(BLENDER_EXECUTABLE) and "blender" not in BLENDER_EXECUTABLE:
                print(f"Warning: Blender executable not found at {BLENDER_EXECUTABLE}. Trying global 'blender' command...")
                executable = "blender"
            else:
                executable = BLENDER_EXECUTABLE
                
            try:
                subprocess.run(
                    [executable, "--background", "--python", GENERATED_SCRIPT_PATH],
                    check=True,
                    capture_output=True,
                    text=True
                )
            except subprocess.CalledProcessError as e:
                raise RuntimeError(f"Blender execution failed:\n{e.stderr}")
            except FileNotFoundError:
                print(f"Warning: Executable '{executable}' not found. Script generated but not executed.")

    def self_correct(self, stage: int, error: Exception):
        print(f"Attempting self-correction for stage {stage}. Error: {error}")
        # Simulated LLM self-correction logic fixing geometric constraints
        if "Geometry constraint violated" in str(error):
            print("[Self-Correction Agent] Detected geometry anomaly. Enforcing t_y = 0.0 constraint...")
            objects = self.state.get("objects", [])
            for obj in objects:
                if obj.get("transform", {}).get("t_y", 0.0) != 0.0:
                    old_ty = obj["transform"]["t_y"]
                    obj["transform"]["t_y"] = 0.0
                    print(f"  -> Fixing object '{obj['id']}': t_y was {old_ty}, now 0.0")
            print("[Self-Correction Agent] State successfully repaired.")

    def run(self) -> tuple[str, str]:
        print("Initializing Orchestrator Loop...")
        self.state = self.payload
        
        for stage in range(1, 6):
            self.current_stage = stage
            success = False
            retries = 0
            
            while not success and retries <= MAX_RETRIES:
                try:
                    self.execute_stage(stage)
                    self.validate_state()
                    success = True
                    print(f"Stage {stage} completed successfully.")
                except Exception as e:
                    retries += 1
                    if retries <= MAX_RETRIES:
                        self.self_correct(stage, e)
                    else:
                        print(f"FAILED: Stage {stage} failed after {MAX_RETRIES} retries. Halting execution.")
                        raise RuntimeError(f"Failed at stage {stage}: {e}")
                        
        return self.output_blend, self.output_glb

if __name__ == "__main__":
    with open("mock_payload.json", "r") as f:
        payload = json.load(f)
    orchestrator = BlenderOrchestrator(payload)
    orchestrator.run()
