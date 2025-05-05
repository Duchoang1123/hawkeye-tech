import numpy as np
from calibrate import ViewTransformer

def test_view_transformer():
    # Initialize the transformer
    transformer = ViewTransformer()
    
    # Test 1: Calibration
    print("\nTest 1: Calibration")
    try:
        # Replace 'test_video.mp4' with your actual video file
        transformer.calibrate('test.mp4')
        print("Calibration successful!")
        print("Pixel vertices:", transformer.pixel_vertices)
        print("Perspective transformer matrix:", transformer.perspective_transformer)
    except Exception as e:
        print(f"Calibration failed: {e}")
        return
    
    # Test 2: Point Transformation
    print("\nTest 2: Point Transformation")
    # Test points inside and outside the court
    test_points = [
        np.array([500, 500]),  # Should be inside court
        np.array([0, 0]),      # Should be outside court
        np.array([1000, 1000]) # Should be outside court
    ]
    
    for point in test_points:
        transformed = transformer.transform_point(point)
        print(f"\nOriginal point: {point}")
        print(f"Transformed point: {transformed}")
    
    # Test 3: Track Processing
    print("\nTest 3: Track Processing")
    # Create sample track data
    sample_tracks = {
        'player': [
            {
                '1': {
                    'position_adjusted': [500, 500]
                },
                '2': {
                    'position_adjusted': [0, 0]
                }
            }
        ]
    }
    
    transformer.add_transformed_position_to_tracks(sample_tracks)
    print("Processed tracks:", sample_tracks)

if __name__ == "__main__":
    test_view_transformer() 