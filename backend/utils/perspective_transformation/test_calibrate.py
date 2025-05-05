import numpy as np
import cv2
import os
from calibrate import ViewTransformer

def create_court_layout(court_width=9, court_length=18, scale=50):
    """Create a visualization of the court layout"""
    # Create a white image
    img = np.ones((court_width*scale, court_length*scale, 3), dtype=np.uint8) * 255
    
    # Draw court boundaries
    cv2.rectangle(img, (0, 0), (court_width*scale, court_length*scale), (0, 0, 0), 2)
    
    return img

def test_view_transformer():
    # Initialize the transformer with vertical orientation
    transformer = ViewTransformer(vertical=True)
    
    # Test 1: Calibration
    print("\nTest 1: Calibration")
    try:
        transformer.calibrate('test.mp4')
        print("Calibration successful!")
        print("Pixel vertices:", transformer.pixel_vertices)
        print("Perspective transformer matrix:", transformer.perspective_transformer)
    except Exception as e:
        print(f"Calibration failed: {e}")
        return
    
    # Create visualization
    court_img = create_court_layout()
    
    # Get the video frame used for calibration
    video_path = os.path.join(os.path.dirname(__file__), '..', '..', 'videos', 'test.mp4')
    cap = cv2.VideoCapture(video_path)
    cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
    ret, frame = cap.read()
    cap.release()
    
    if not ret:
        print("Could not read video frame")
        return
    
    # Create a black canvas for the entire window
    window_width = 2500
    window_height = 1080
    combined = np.zeros((window_height, window_width, 3), dtype=np.uint8)
    
    # Place the video frame at (0,0)
    combined[0:frame.shape[0], 0:frame.shape[1]] = frame
    
    # Define court layout position and scale
    court_start_x = 1985
    court_start_y = 90
    court_scale = 50  # pixels per meter
    
    # Draw court boundaries
    court_width_pixels = 9 * court_scale
    court_length_pixels = 18 * court_scale
    cv2.rectangle(combined, 
                 (court_start_x, court_start_y),
                 (court_start_x + court_width_pixels, court_start_y + court_length_pixels),
                 (255, 255, 255), 2)
    
    # Define colors for points in the correct order
    colors = [(0, 255, 0), (0, 0, 255), (255, 0, 0), (255, 255, 0)]  # Green, Blue, Red, Yellow
    
    # Draw points on both images
    for i, (point, color) in enumerate(zip(transformer.pixel_vertices, colors)):
        # Draw on video frame
        cv2.circle(combined, (int(point[0]), int(point[1])), 10, color, -1)
        cv2.putText(combined, str(i+1), (int(point[0])-10, int(point[1])-10),
                   cv2.FONT_HERSHEY_SIMPLEX, 1, color, 2)
        
        # Draw on court layout
        court_point = transformer.target_vertices[i]
        window_x = court_start_x + court_point[0] * court_scale
        window_y = court_start_y + court_point[1] * court_scale
        cv2.circle(combined, (int(window_x), int(window_y)), 10, color, -1)
        cv2.putText(combined, str(i+1), (int(window_x) - 10, int(window_y) - 10),
                   cv2.FONT_HERSHEY_SIMPLEX, 1, color, 2)
    
    # Test some additional points
    test_points = [
        np.array([500, 500]),
        np.array([800, 600]),
        np.array([300, 400])
    ]
    
    for point in test_points:
        transformed = transformer.transform_point(point)
        if transformed is not None:
            # Draw original point on video frame
            cv2.circle(combined, (int(point[0]), int(point[1])), 5, (255, 0, 255), -1)
            
            # Draw transformed point on court layout
            court_point = transformed[0]
            window_x = court_start_x + court_point[0] * court_scale
            window_y = court_start_y + court_point[1] * court_scale
            cv2.circle(combined, (int(window_x), int(window_y)), 5, (255, 0, 255), -1)
    
    # Display the visualization
    cv2.imshow('Calibration Visualization', combined)
    cv2.waitKey(0)
    cv2.destroyAllWindows()

if __name__ == "__main__":
    test_view_transformer() 