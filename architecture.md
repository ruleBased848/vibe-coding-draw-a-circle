# Website Architecture: "Draw a Circle and Get Rated"

## 1. UI

### a. User Interface
- **Canvas Area**: Interactive HTML5 canvas for users to draw freehand circles.
- **Instructions Panel**: Brief instructions on how to draw and submit.
- **Submit Button**: To finalize the drawing and trigger the rating.
- **Rating Display**: Shows the "perfection" score and possibly visual feedback.
- **Reset/Clear Button**: Allows users to try again.

### b. Technologies
- HTML5, CSS3 (for layout and styling)
- JavaScript (for canvas interaction and client-side logic)

## 2. Circle Rating Algorithm

### a. Input
- User-drawn path (a rasterized image)

### b. Processing
- Fit the best possible circle to the user’s path (e.g., least squares fitting)
- Calculate deviation of user path from the fitted circle
- Normalize and compute a "perfection" score (e.g., 0–100)
- Becareful! If we use naive algorithm, even when the user draws only some part of the circle, the user can get high score. Thus we check if the user drew a complete circle.
- Also, we prohibit drawing small circle, because it's too easy to draw small and perfect circle.

### c. Output
- Numeric score
- Visual overlay showing the fitted circle and deviations
