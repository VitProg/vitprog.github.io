// Grid and Wave Animation
document.addEventListener('DOMContentLoaded', function() {
  // Constants for animation and effects
  const GRID_CELL_SIZE = 64; // Fixed grid cell size as requested
  const MOVE_THROTTLE_MS = 20; // ms between mouse move updates
  const CURSOR_INFLUENCE_RADIUS = 175; // px - radius of cursor influence
  const CURSOR_INFLUENCE_RADIUS_SQUARED = CURSOR_INFLUENCE_RADIUS * CURSOR_INFLUENCE_RADIUS; // Pre-calculated for performance
  const CURSOR_ATTRACTION_STRENGTH = 25; // Strength of cursor attraction
  const CURSOR_POINT_SIZE_MULTIPLIER = 1.5; // Size multiplier for cursor point
  const WAVE_FREQUENCY = 0.01; // Frequency of wave animation
  const WAVE_ANIMATION_SPEED = 0.5; // Speed of wave animation for shapes
  const WAVE_AMPLITUDE_SHAPES = 5; // Amplitude of wave effect for shapes
  const MAX_DISPLACEMENT = 30; // Maximum displacement for opacity calculation
  const MIN_LINE_OPACITY = 0.1; // Minimum opacity for grid lines
  const MAX_LINE_OPACITY = 0.7; // Maximum opacity for grid lines
  const NEIGHBOR_DISTANCE_MULTIPLIER = 1.5; // Multiplier for neighbor distance
  const ALIGNMENT_THRESHOLD_MULTIPLIER = 0.25; // Threshold for horizontal/vertical alignment
  const VISIBILITY_THRESHOLD = 50; // px - threshold for visibility checks
  const PARALLAX_FACTOR = 0.06; // Strength of parallax effect
  const SHAPE_CURSOR_INFLUENCE = 0.01; // Cursor influence on shapes
  const GRID_SIZE_MULTIPLIER = 1.5; // Generate grid larger than initial window
  const SHAPE_COUNT = 8; // Number of shapes to create
  const SCROLL_REVEAL_OFFSET = 100; // px - how far from the bottom of the viewport to trigger reveal

  const canvas = document.getElementById('background-canvas');
  const ctx = canvas.getContext('2d');

  // Set canvas size to match window
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  // Initial resize
  resizeCanvas();

  // Resize on window change
  window.addEventListener('resize', resizeCanvas);

  // Mouse position tracking
  let mouseX = 0;
  let mouseY = 0;
  let targetX = 0;
  let targetY = 0;

  // Scroll position tracking for parallax effect
  let scrollY = 0;
  let lastScrollY = 0;

  // For performance optimization, limit how often we process mouse moves
  let lastMoveTime = 0;

  // Track mouse movement with throttling
  document.addEventListener('mousemove', function(e) {
    const now = Date.now();
    if (now - lastMoveTime > MOVE_THROTTLE_MS) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      lastMoveTime = now;
    }
  });

  // Track scroll position for parallax effect and reveal animations
  window.addEventListener('scroll', function() {
    scrollY = window.scrollY;
    checkExperienceItemsVisibility();
  });

  // Grid configuration
  const gridConfig = {
    spacing: GRID_CELL_SIZE, // Fixed grid cell size
    pointSize: 1.5, // Slightly smaller points
    lineWidth: 0.8, // Thinner lines
    distortionFactor: 40, // Increased for more visible wave effect
    inertia: 0.08, // Increased for smoother animation
    waveSpeed: 0.05, // Controls wave animation speed
    waveAmplitude: 15, // Controls wave height
    colors: {
      points: 'rgba(100, 255, 218, 0.4)',
      lines: 'rgba(100, 255, 218, 0.15)',
      shapes: 'rgba(26, 54, 93, 0.3)'
    }
  };

  // Create grid points
  function createGrid() {
    const grid = [];
    // Calculate grid dimensions with extra padding to accommodate future window resizing
    // Use a multiplier to create a larger grid than the initial window size
    const cols = Math.ceil((canvas.width * GRID_SIZE_MULTIPLIER) / gridConfig.spacing) + 2;
    const rows = Math.ceil((canvas.height * GRID_SIZE_MULTIPLIER) / gridConfig.spacing) + 2;

    // Calculate offset to center the larger grid in the initial window
    const offsetX = -((cols * gridConfig.spacing) - canvas.width) / 2;
    const offsetY = -((rows * gridConfig.spacing) - canvas.height) / 2;

    // Store grid dimensions for faster access
    grid.cols = cols;
    grid.rows = rows;

    // Pre-calculate grid indices for faster lookup
    const indices = new Array(rows);
    for (let j = 0; j < rows; j++) {
      indices[j] = new Array(cols);
      for (let i = 0; i < cols; i++) {
        const index = j * cols + i;
        indices[j][i] = index;
      }
    }
    grid.indices = indices;

    // Create grid points
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const x = i * gridConfig.spacing + offsetX;
        const y = j * gridConfig.spacing + offsetY;
        grid.push({
          x: x,
          y: y,
          originalX: x,
          originalY: y,
          distortionX: 0,
          distortionY: 0
        });
      }
    }

    return grid;
  }

  let grid = createGrid();

  // Create angular shapes
  const shapes = [];
  function createAngularShapes() {
    // Use a multiplier to create shapes for a larger area than the initial window size

    // Create a grid of shapes for better distribution
    const gridX = Math.ceil(Math.sqrt(SHAPE_COUNT));
    const gridY = Math.ceil(SHAPE_COUNT / gridX);

    const cellWidth = (canvas.width * GRID_SIZE_MULTIPLIER) / gridX;
    const cellHeight = (canvas.height * GRID_SIZE_MULTIPLIER) / gridY;

    // Calculate offset to center the shapes in the initial window
    const offsetX = -((canvas.width * GRID_SIZE_MULTIPLIER) - canvas.width) / 2;
    const offsetY = -((canvas.height * GRID_SIZE_MULTIPLIER) - canvas.height) / 2;

    let shapesCreated = 0;

    // Create shapes in a grid pattern for better distribution
    for (let y = 0; y < gridY && shapesCreated < SHAPE_COUNT; y++) {
      for (let x = 0; x < gridX && shapesCreated < SHAPE_COUNT; x++) {
        // Calculate center position with some randomness within the cell
        // Apply offset to center shapes in the initial window
        const centerX = x * cellWidth + cellWidth * (0.3 + Math.random() * 0.4) + offsetX;
        const centerY = y * cellHeight + cellHeight * (0.3 + Math.random() * 0.4) + offsetY;

        // Vary size based on position for visual interest
        const sizeVariation = 0.7 + Math.random() * 0.6;
        const size = Math.min(cellWidth, cellHeight) * sizeVariation;

        // More angular shapes (4-6 points) to match reference
        const pointCount = Math.floor(Math.random() * 3) + 4;
        const points = [];

        // Add slight rotation for variety
        const rotation = Math.random() * Math.PI * 2;

        // Generate shape points with more angular variation
        for (let j = 0; j < pointCount; j++) {
          const angle = rotation + (j / pointCount) * Math.PI * 2;
          // More variation in point distance for more angular shapes
          const randomOffset = (Math.random() * 0.5 + 0.7);
          points.push({
            angle: angle,
            distance: size * randomOffset
          });
        }

        // Add depth property for parallax effect (random value between 0.1 and 1)
        // Lower values will move slower (appear further away)
        // Higher values will move faster (appear closer)
        const depth = 0.1 + Math.random() * 0.9;

        shapes.push({
          centerX: centerX,
          centerY: centerY,
          originalY: centerY, // Store original Y position for parallax calculation
          size: size,
          points: points,
          depth: depth
        });

        shapesCreated++;
      }
    }
  }

  // Create initial shapes
  createAngularShapes();

  // We no longer regenerate grid and shapes on resize to avoid visual disruption
  // The objects are only generated at startup

  // Animation time tracking for wave effect
  let time = 0;

  let needAnim = false;
  // Animation loop
  function animate() {
    needAnim = !needAnim;
    if (!needAnim) {
      requestAnimationFrame(animate);
      return;
    }

    // Update time for wave animation
    time += gridConfig.waveSpeed;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Smooth mouse targeting with inertia
    targetX += (mouseX - targetX) * gridConfig.inertia;
    targetY += (mouseY - targetY) * gridConfig.inertia;

    // Calculate scroll change for parallax effect
    const scrollDelta = scrollY - lastScrollY;
    lastScrollY = scrollY;

    // Note: Grid points are no longer animated - they remain at their original positions
    // We still calculate distortions for shapes animation only
    const cols = grid.cols;
    const rows = grid.rows;

    // Process grid points in batches for shapes animation only
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const index = grid.indices[j][i];
        const point = grid[index];

        // Calculate distance squared (avoid sqrt for performance)
        const dx = targetX - point.originalX;
        const dy = targetY - point.originalY;
        const distanceSquared = dx * dx + dy * dy;

        // Wave effect - add sine wave distortion
        const waveX = Math.sin(point.originalX * WAVE_FREQUENCY + time) * gridConfig.waveAmplitude;
        const waveY = Math.cos(point.originalY * WAVE_FREQUENCY + time) * gridConfig.waveAmplitude;

        // Combine cursor influence and wave effect
        if (distanceSquared < CURSOR_INFLUENCE_RADIUS_SQUARED) {
          // Avoid sqrt by using squared distance
          const distance = Math.sqrt(distanceSquared); // Only calculate sqrt when needed
          const influence = (1 - distance / CURSOR_INFLUENCE_RADIUS) * gridConfig.distortionFactor;

          // Apply cursor influence
          point.distortionX = (dx / distance || 0) * influence * 0.5 + waveX;
          point.distortionY = (dy / distance || 0) * influence * 0.5 + waveY;
        } else {
          // Only apply wave effect when cursor is far
          point.distortionX = waveX;
          point.distortionY = waveY;
        }

        // Update point position for shapes animation only
        // Grid points will use originalX and originalY directly
        point.x = point.originalX + point.distortionX;
        point.y = point.originalY + point.distortionY;
      }
    }

    // Draw in order: shapes first (background), then grid points
    drawAngularShapes();
    drawGridPoints();

    // Request next frame
    requestAnimationFrame(animate);
  }

  // Draw grid points with cursor attraction and connecting lines
  function drawGridPoints() {
    // Define gradient colors (bluish to aquamarine)
    const topColor = { r: 70, g: 130, b: 230, a: 0.4 }; // Bluish color
    const bottomColor = { r: 100, g: 255, b: 218, a: 0.4 }; // Aquamarine (original color)

    // Draw all points for complete grid coverage
    const skipFactor = 1; // Draw every point
    const cols = grid.cols;
    const rows = grid.rows;

    // Calculate original grid spacing for line drawing threshold
    const originalSpacing = gridConfig.spacing;

    // Store point colors for line drawing
    const pointColors = [];

    // First pass: draw points and store their colors
    for (let j = 0; j < rows; j += skipFactor) {
      for (let i = 0; i < cols; i += skipFactor) {
        const index = grid.indices[j][i];
        const point = grid[index];

        // Only process points that are visible (using original coordinates for visibility check)
        // Include points at the screen border and one row/column beyond for better edge effects
        if (point.originalX >= -gridConfig.spacing && point.originalX <= canvas.width + gridConfig.spacing && 
            point.originalY >= -gridConfig.spacing && point.originalY <= canvas.height + gridConfig.spacing) {

          // Calculate cursor attraction effect
          let x = point.originalX;
          let y = point.originalY;

          // Calculate distance to cursor
          const dx = targetX - point.originalX;
          const dy = targetY - point.originalY;
          const distanceSquared = dx * dx + dy * dy;

          // Apply cursor attraction within defined radius
          if (distanceSquared < CURSOR_INFLUENCE_RADIUS_SQUARED) {
            const distance = Math.sqrt(distanceSquared);
            const attraction = (1 - distance / CURSOR_INFLUENCE_RADIUS) * CURSOR_ATTRACTION_STRENGTH; // Stronger attraction when closer

            // Move point towards cursor based on distance
            x += (dx / distance) * attraction;
            y += (dy / distance) * attraction;
          }

          // Update point position with attraction effect
          point.x = x;
          point.y = y;

          // Calculate gradient color based on y-position
          const ratio = point.originalY / canvas.height;
          const r = Math.floor(topColor.r + (bottomColor.r - topColor.r) * ratio);
          const g = Math.floor(topColor.g + (bottomColor.g - topColor.g) * ratio);
          const b = Math.floor(topColor.b + (bottomColor.b - topColor.b) * ratio);

          // Calculate alpha based on distance to cursor (0 to 0.6)
          const distToCursor = Math.sqrt(distanceSquared);
          const maxDistance = CURSOR_INFLUENCE_RADIUS * 2; // Maximum distance to consider
          // Alpha ranges from 0 (at cursor) to 0.6 (far from cursor)
          const alpha = Math.min(0.6, (distToCursor / maxDistance) * 0.6);

          // Store color for this point with calculated alpha
          pointColors[index] = { r, g, b, a: alpha };

          // Set the color for this specific point with calculated alpha
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;

          ctx.beginPath();
          ctx.arc(point.x, point.y, gridConfig.pointSize, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Second pass: draw lines between points
    // Create an array of visible points for faster processing
    const visiblePoints = [];

    // Collect all visible points first
    for (let j = 0; j < rows; j += skipFactor) {
      for (let i = 0; i < cols; i += skipFactor) {
        const index = grid.indices[j][i];
        const point = grid[index];

        // Only include points that are visible
        // Include points at the screen border and one row/column beyond for better edge effects
        if (point.originalX >= -gridConfig.spacing && point.originalX <= canvas.width + gridConfig.spacing && 
            point.originalY >= -gridConfig.spacing && point.originalY <= canvas.height + gridConfig.spacing) {
          visiblePoints.push({
            index: index,
            point: point
          });
        }
      }
    }

    // Add cursor point to the visible points array
    // Create a cursor point with a color gradient similar to other points
    const cursorRatio = targetY / canvas.height;
    const cursorR = Math.floor(topColor.r + (bottomColor.r - topColor.r) * cursorRatio);
    const cursorG = Math.floor(topColor.g + (bottomColor.g - topColor.g) * cursorRatio);
    const cursorB = Math.floor(topColor.b + (bottomColor.b - topColor.b) * cursorRatio);

    // Create a special index for the cursor point
    const cursorIndex = -1; // Use a negative index to distinguish from grid points

    // Add the cursor point to the points array
    const cursorPoint = {
      x: targetX,
      y: targetY,
      originalX: targetX, // The cursor point doesn't have a fixed original position
      originalY: targetY
    };

    // Calculate alpha for cursor point (always 0 since distance to itself is 0)
    const cursorAlpha = 0; // Cursor point is fully transparent at its own position

    // Draw the cursor point
    ctx.fillStyle = `rgba(${cursorR}, ${cursorG}, ${cursorB}, ${cursorAlpha})`;
    ctx.beginPath();
    ctx.arc(cursorPoint.x, cursorPoint.y, gridConfig.pointSize * CURSOR_POINT_SIZE_MULTIPLIER, 0, Math.PI * 2); // Slightly larger
    ctx.fill();

    // Store the cursor point color
    pointColors[cursorIndex] = { r: cursorR, g: cursorG, b: cursorB, a: cursorAlpha };

    // Add cursor point to visible points
    visiblePoints.push({
      index: cursorIndex,
      point: cursorPoint
    });

    // Check all visible points
    const visiblePointsCount = visiblePoints.length;

    for (let a = 0; a < visiblePointsCount; a++) {
      const pointA = visiblePoints[a];
      const point1 = pointA.point;
      const index1 = pointA.index;
      const color1 = pointColors[index1];

      // Skip if color is not defined
      if (!color1) continue;

      // Calculate displacement from original position
      const displacementX = point1.x - point1.originalX;
      const displacementY = point1.y - point1.originalY;
      const displacement = Math.sqrt(displacementX * displacementX + displacementY * displacementY);

      // Only draw lines if the point has been displaced or it's the cursor point
      if (displacement > 0 || index1 === cursorIndex) {
        // Calculate opacity based on displacement
        // Map displacement from 0 to MAX_DISPLACEMENT to MIN_LINE_OPACITY to MAX_LINE_OPACITY
        const maxDisplacement = MAX_DISPLACEMENT; // Based on the attraction calculation
        const minOpacity = MIN_LINE_OPACITY;
        const maxOpacity = MAX_LINE_OPACITY;

        // Calculate normalized displacement (0 to 1)
        const normalizedDisplacement = Math.min(displacement / maxDisplacement, 1);

        // Calculate opacity using the normalized displacement
        const baseOpacity = minOpacity + normalizedDisplacement * (maxOpacity - minOpacity);

        // Define neighbor distance (use original grid spacing as reference)
        const neighborDistance = originalSpacing * NEIGHBOR_DISTANCE_MULTIPLIER; // Consider points within multiplier x grid spacing as neighbors
        const neighborDistanceSquared = neighborDistance * neighborDistance;

        for (let b = 0; b < visiblePointsCount; b++) {
          // Skip comparing the same point
          if (a === b) continue;

          const pointB = visiblePoints[b];
          const point2 = pointB.point;
          const index2 = pointB.index;
          const color2 = pointColors[index2];

          // Skip if color is not defined
          if (!color2) continue;

          // Calculate distance between points (using squared distance for performance)
          const dx = point1.x - point2.x;
          const dy = point1.y - point2.y;
          const distanceSquared = dx * dx + dy * dy;

          // Only draw lines to neighbors (points within neighborDistance)
          if (distanceSquared < neighborDistanceSquared) {
            // Check if the connection is horizontal or vertical (not diagonal)
            // Use a more lenient threshold based on grid spacing to account for point movement
            const alignmentThreshold = originalSpacing * ALIGNMENT_THRESHOLD_MULTIPLIER;
            const isHorizontal = Math.abs(point1.y - point2.y) < alignmentThreshold;
            const isVertical = Math.abs(point1.x - point2.x) < alignmentThreshold;

            // Only draw the line if it's horizontal or vertical
            if (isHorizontal || isVertical) {
              // Calculate average color
              const avgR = Math.floor((color1.r + color2.r) / 2);
              const avgG = Math.floor((color1.g + color2.g) / 2);
              const avgB = Math.floor((color1.b + color2.b) / 2);

              // Draw line with opacity based on displacement
              ctx.beginPath();
              ctx.moveTo(point1.x, point1.y);
              ctx.lineTo(point2.x, point2.y);
              ctx.strokeStyle = `rgba(${avgR}, ${avgG}, ${avgB}, ${baseOpacity})`;
              ctx.lineWidth = 0.8;
              ctx.stroke();
            }
          }
        }
      }
    }
  }

  // Draw grid lines - optimized to use cached dimensions and skip offscreen lines
  function drawGridLines() {
    ctx.strokeStyle = gridConfig.colors.lines;
    ctx.lineWidth = gridConfig.lineWidth;

    const cols = grid.cols;
    const rows = grid.rows;

    // Draw horizontal lines with visibility check
    for (let j = 0; j < rows; j++) {
      // Check if this row might be visible
      const firstPointIndex = grid.indices[j][0];
      const lastPointIndex = grid.indices[j][cols-1];

      // Include lines at the screen border and one row beyond for better edge effects
      if (grid[firstPointIndex].y < -gridConfig.spacing && grid[lastPointIndex].y < -gridConfig.spacing) continue;
      if (grid[firstPointIndex].y > canvas.height + gridConfig.spacing && grid[lastPointIndex].y > canvas.height + gridConfig.spacing) continue;

      ctx.beginPath();
      for (let i = 0; i < cols; i++) {
        const index = grid.indices[j][i];
        if (i === 0) {
          ctx.moveTo(grid[index].x, grid[index].y);
        } else {
          ctx.lineTo(grid[index].x, grid[index].y);
        }
      }
      ctx.stroke();
    }

    // Draw vertical lines with visibility check
    for (let i = 0; i < cols; i++) {
      // Check if this column might be visible
      const firstPointIndex = grid.indices[0][i];
      const lastPointIndex = grid.indices[rows-1][i];

      // Include lines at the screen border and one column beyond for better edge effects
      if (grid[firstPointIndex].x < -gridConfig.spacing && grid[lastPointIndex].x < -gridConfig.spacing) continue;
      if (grid[firstPointIndex].x > canvas.width + gridConfig.spacing && grid[lastPointIndex].x > canvas.width + gridConfig.spacing) continue;

      ctx.beginPath();
      for (let j = 0; j < rows; j++) {
        const index = grid.indices[j][i];
        if (j === 0) {
          ctx.moveTo(grid[index].x, grid[index].y);
        } else {
          ctx.lineTo(grid[index].x, grid[index].y);
        }
      }
      ctx.stroke();
    }
  }

  // Pre-calculate gradients for shapes to avoid recreating them every frame
  const shapeGradients = [];

  // Function to create and cache gradients
  function createShapeGradients() {
    shapes.forEach((shape, index) => {
      const gradient = ctx.createLinearGradient(
        shape.centerX - shape.size/2, shape.centerY - shape.size/2,
        shape.centerX + shape.size/2, shape.centerY + shape.size/2
      );
      // Use more vibrant blue gradients to match reference
      gradient.addColorStop(0, 'rgba(41, 121, 255, 0.1)');
      gradient.addColorStop(0.5, 'rgba(32, 84, 178, 0.1)');
      gradient.addColorStop(1, 'rgba(10, 25, 47, 0.1)');
      shapeGradients[index] = gradient;
    });
  }

  // Create initial gradients
  createShapeGradients();

  // We no longer recreate gradients on resize to avoid visual disruption
  // Gradients are only created at startup

  // Draw angular shapes with gradients - optimized to use cached gradients
  function drawAngularShapes() {
    // Only process shapes that might be visible
    shapes.forEach((shape, index) => {
      // Apply parallax effect based on scroll position and shape depth
      // Multiply by a factor to control the strength of the parallax effect
      const parallaxOffset = scrollY * shape.depth * PARALLAX_FACTOR;

      // Apply parallax to shape position (shapes with higher depth move more)
      // Use a local variable instead of modifying the shape's centerY directly
      const parallaxY = shape.originalY - parallaxOffset;

      // Skip shapes that are completely off-screen (with updated Y position)
      if (shape.centerX + shape.size < 0 || 
          shape.centerX - shape.size > canvas.width ||
          parallaxY + shape.size < 0 || 
          parallaxY - shape.size > canvas.height) {
        return;
      }

      // Use cached gradient
      ctx.fillStyle = shapeGradients[index];
      ctx.beginPath();

      // Apply wave effect to shapes too for a cohesive look
      const waveOffsetX = Math.sin(time * WAVE_ANIMATION_SPEED) * WAVE_AMPLITUDE_SHAPES;
      const waveOffsetY = Math.cos(time * WAVE_ANIMATION_SPEED) * WAVE_AMPLITUDE_SHAPES;

      // Calculate cursor influence - less frequent calculation
      const distX = (targetX - shape.centerX) * SHAPE_CURSOR_INFLUENCE;
      const distY = (targetY - parallaxY) * SHAPE_CURSOR_INFLUENCE; // Use parallaxY for Y-axis calculations

      // Draw shape with optimized point calculation
      shape.points.forEach((point, i) => {
        // Combine cursor movement, wave effect, and parallax
        const x = shape.centerX + Math.cos(point.angle) * point.distance + distX + waveOffsetX;
        const y = parallaxY + Math.sin(point.angle) * point.distance + distY + waveOffsetY;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.closePath();
      ctx.fill();
    });
  }

  // Start animation
  animate();

  // Experience items scroll reveal functionality
  const experienceItems = document.querySelectorAll('.experience-item');

  // Function to check if an element is in the viewport
  function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
      rect.bottom > 0 &&
      rect.right > 0 &&
      rect.top < (window.innerHeight || document.documentElement.clientHeight) + SCROLL_REVEAL_OFFSET &&
      rect.left < (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  // Function to check if an element is above the viewport
  function isAboveViewport(element) {
    const rect = element.getBoundingClientRect();
    return rect.bottom < 0;
  }

  // Function to check if an element is below the viewport
  function isBelowViewport(element) {
    const rect = element.getBoundingClientRect();
    return rect.top > (window.innerHeight || document.documentElement.clientHeight);
  }


  // Function to check visibility of experience items and apply scroll-based animations
  function checkExperienceItemsVisibility() {
    experienceItems.forEach((item, index) => {
      const rect = item.getBoundingClientRect();
      const windowHeight = window.innerHeight || document.documentElement.clientHeight;

      // Calculate how far the element is from the bottom of the viewport
      // This will be used to determine the opacity and scale
      const distanceFromBottom = windowHeight - rect.top;
      const distanceFromTop = rect.bottom;

      // Define thresholds for animation - using 15% of viewport height
      const appearThreshold = windowHeight * 0.15; // 15% of viewport height from bottom
      const fullyVisibleThreshold = windowHeight * 0.3; // When element should be fully visible
      const disappearThreshold = windowHeight * 0.15; // 15% of viewport height from top

      // Calculate opacity and scale based on position
      let opacity, scale;

      if (distanceFromBottom < 0) {
        // Element is completely below viewport - invisible and scaled down
        opacity = 0;
        scale = 0.75;
      } else if (distanceFromTop < 0) {
        // Element is completely above viewport - invisible and scaled down (same as below viewport)
        opacity = 0;
        scale = 0.75;
      } else if (distanceFromBottom < appearThreshold) {
        // Element is starting to enter viewport from bottom
        // Map position to opacity and scale (0 to 1)
        const progress = distanceFromBottom / appearThreshold;
        opacity = Math.min(progress, 1);
        scale = 0.75 + (0.25 * progress);
      } else if (distanceFromTop < disappearThreshold) {
        // Element is starting to exit viewport from top
        // Map position to opacity and scale (1 to 0)
        const progress = distanceFromTop / disappearThreshold;
        opacity = Math.min(progress, 1);
        scale = 1 - (0.25 * (1 - progress));
      } else {
        // Element is fully visible in viewport
        opacity = 1;
        scale = 1;
      }

      // Apply calculated styles directly
      item.style.opacity = opacity;
      item.style.transform = `scale(${scale})`;

      // Remove all classes as we're using inline styles now
      item.classList.remove('visible', 'hidden-top', 'transitioning');
    });
  }

  // Initial check for all items on page load
  // No need to make only the first item visible - the checkExperienceItemsVisibility function
  // will set the appropriate visibility for all items based on their position
  checkExperienceItemsVisibility();

  // Also check visibility when the page is fully loaded
  window.addEventListener('load', checkExperienceItemsVisibility);
});
