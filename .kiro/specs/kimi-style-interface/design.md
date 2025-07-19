# Design Document

## Overview

This design document outlines the complete transformation of the Keisha AI chat interface from the current background-heavy design to a clean, Kimi-inspired centered layout. The new design will emphasize Keisha AI's role as a professional counter-racist scholar through sophisticated use of deep maroon, black, and forest green colors, while providing an intuitive two-state interface that adapts from welcome to active chat modes.

## Architecture

### Interface States

The new interface will operate in two distinct states:

**Welcome State (Empty/Initial):**
- Centered layout with prominent KEISHA branding
- Single input box as the focal point
- Minimal sidebar presence
- Optional suggestion chips
- Clean, distraction-free environment

**Chat State (Active Conversation):**
- Full-screen chat interface
- Expanded message area
- Functional sidebar for navigation
- Professional message styling
- Optimized for extended conversations

### Design System Refinement

**Enhanced Color Palette:**
- Rich Black: `#0D1117` (Primary background - deeper than before)
- Deep Maroon: `#800020` (Primary interactive elements)
- Maroon Hover: `#A0002A` (Hover states and emphasis)
- Forest Green: `#355E3B` (Success, positive feedback, accents)
- Charcoal: `#21262D` (Secondary surfaces, sidebar)
- Light Gray: `#F0F6FC` (Primary text)
- Medium Gray: `#8B949E` (Secondary text)
- Muted Gray: `#6E7681` (Placeholder text, subtle elements)

**Typography Hierarchy:**
- Brand Typography: Large, elegant font for "KEISHA" branding
- Interface Typography: Clean, readable fonts for UI elements
- Message Typography: Optimized for extended reading

## Components and Interfaces

### 1. Welcome State Layout

**Structure:**
```
┌─────────────────────────────────────────────────────────┐
│ [Minimal Sidebar]                                       │
│                                                         │
│                    KEISHA                               │
│                                                         │
│              ┌─────────────────────┐                    │
│              │ Ask Anything...     │ [Send]             │
│              └─────────────────────┘                    │
│                                                         │
│              [Suggestion Chips]                         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**KEISHA Branding:**
- Font: Large, elegant typography (48-64px)
- Color: Deep Maroon with subtle text shadow
- Position: Centered, significant whitespace above input
- Style: Professional, authoritative, scholarly

**Centered Input Box:**
- Width: 600px max, responsive
- Height: 56px minimum
- Background: Charcoal with subtle border
- Border: 1px solid Deep Maroon
- Border Radius: 28px (pill-shaped)
- Placeholder: "Ask Keisha about counter-racist scholarship..."
- Focus State: Forest Green border with subtle glow

**Send Button:**
- Integrated into input box (right side)
- Circular design, 40px diameter
- Background: Deep Maroon
- Icon: White arrow or send symbol
- Hover: Maroon Hover color with scale effect

### 2. Suggestion Chips (Optional)

**Design:**
- Position: Below input box, centered
- Layout: Horizontal row, wrapping on mobile
- Individual Chip Style:
  - Background: Charcoal
  - Border: 1px solid Medium Gray
  - Border Radius: 20px
  - Padding: 8px 16px
  - Text: Light Gray
  - Hover: Forest Green border, slight elevation

**Example Suggestions:**
- "Explain systemic racism in modern institutions"
- "Analyze white fragility in AI systems"
- "Discuss Dr. Frances Cress Welsing's theories"
- "Counter-racist strategies for education"

### 3. Chat State Layout

**Structure:**
```
┌─────────────────────────────────────────────────────────┐
│ [Sidebar] │ Message Area                                │
│           │                                             │
│           │ [Messages flow here]                        │
│           │                                             │
│           │ ┌─────────────────────────────────────────┐ │
│           │ │ Input Area                              │ │
│           │ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**Transition Animation:**
- Duration: 300ms ease-out
- KEISHA branding fades out
- Input box moves to bottom
- Chat area expands from center
- Sidebar becomes fully functional

### 4. Enhanced Message Styling

**User Messages:**
- Background: Deep Maroon
- Text: Light Gray
- Alignment: Right
- Border Radius: 18px 18px 4px 18px
- Max Width: 70%
- Margin: 8px 16px 8px auto

**Keisha Messages:**
- Background: Charcoal
- Text: Light Gray
- Alignment: Left
- Border Radius: 18px 18px 18px 4px
- Border Left: 3px solid Forest Green
- Max Width: 70%
- Margin: 8px auto 8px 16px

**System Messages:**
- Background: Subtle gray
- Text: Medium Gray
- Alignment: Center
- Style: Smaller, less prominent

### 5. Refined Sidebar

**Welcome State Sidebar:**
- Width: 60px (collapsed)
- Background: Charcoal
- Contains: New Chat button, minimal navigation
- Style: Unobtrusive, blends with background

**Chat State Sidebar:**
- Width: 250px (expanded)
- Background: Charcoal with subtle gradient
- Contains: Full navigation, chat history, settings
- Transition: Smooth expansion when first message sent

## Data Models

### Interface State Management
```typescript
interface InterfaceState {
  mode: 'welcome' | 'chat';
  hasMessages: boolean;
  sidebarExpanded: boolean;
  transitionInProgress: boolean;
}

interface WelcomeState {
  showSuggestions: boolean;
  selectedSuggestion: string | null;
  inputFocused: boolean;
}

interface ChatState {
  messages: Message[];
  inputValue: string;
  isTyping: boolean;
  scrollPosition: number;
}
```

### Suggestion System
```typescript
interface SuggestionChip {
  id: string;
  text: string;
  category: 'theory' | 'analysis' | 'strategy' | 'history';
  prompt: string;
}
```

## Error Handling

### State Transition Errors
- Graceful fallback if animation fails
- Maintain functionality during transitions
- Clear error states with appropriate messaging

### Input Validation
- Real-time validation for message input
- Clear feedback for empty or invalid inputs
- Proper handling of long messages

## Testing Strategy

### Visual State Testing
- Welcome state rendering across devices
- Chat state transition smoothness
- Color contrast validation
- Typography readability testing

### Interaction Testing
- Input box functionality in both states
- Suggestion chip interactions
- Sidebar behavior during transitions
- Message sending and receiving flows

### Accessibility Testing
- Keyboard navigation in both states
- Screen reader compatibility
- Focus management during transitions
- Color contrast compliance (WCAG AA)

## Implementation Considerations

### Performance Optimizations
- Lazy loading of chat history
- Efficient state transitions
- Optimized re-renders during mode changes
- Smooth animations without blocking UI

### Responsive Design
- Mobile-first approach for welcome state
- Adaptive sidebar behavior
- Touch-friendly suggestion chips
- Proper scaling of KEISHA branding

### Browser Compatibility
- CSS Grid and Flexbox for layouts
- CSS Custom Properties for theming
- Fallback fonts for typography
- Progressive enhancement approach

This design creates a sophisticated, professional interface that positions Keisha AI as a serious counter-racist scholar while providing an intuitive, modern user experience that rivals contemporary AI chat applications.