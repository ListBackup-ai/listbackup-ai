# Development Guidelines for ListBackup.ai v2

## Code Standards and Best Practices

### TypeScript Requirements
- **100% TypeScript coverage** for all new code
- Use **strict mode** configuration
- Define proper interfaces for all API responses
- Leverage existing type definitions from v1 where applicable

### Component Development
- **Functional components only** with React hooks
- Use **lazy loading** for page-level components (follow existing pattern)
- Implement proper **error boundaries** for robust error handling
- **Accessibility-first** development with proper ARIA labels

### Styling Approach
- **Hybrid approach**: Use existing MUI components + new Shadcn/UI components
- **Tailwind CSS** for utility-first styling
- **Responsive design** with mobile-first approach
- **Consistent theming** with CSS variables

### API Integration Patterns
- **Use existing endpoints** - don't create new ones
- **TanStack Query** for all server state management
- **Proper error handling** with user-friendly messages
- **Loading states** for all async operations
- **Optimistic updates** where appropriate

### State Management
- **TanStack Query** for server state (API calls, caching)
- **Zustand** for client state (UI preferences, temporary data)
- **React Hook Form** for form state management
- **Local Storage** for persistence (auth tokens, settings)

### Performance Guidelines
- **Code splitting** by routes and heavy components
- **Image optimization** using Next.js Image component
- **Bundle analysis** to monitor size
- **Lazy loading** for non-critical components
- **Memoization** for expensive calculations

### Security Best Practices
- **Input sanitization** for all user inputs
- **HTTPS only** for all requests
- **Secure token storage** using httpOnly cookies where possible
- **CSP headers** implementation
- **Rate limiting** for forms and API calls

### Testing Strategy
- **Unit tests** for utility functions and hooks
- **Component tests** using React Testing Library
- **Integration tests** for API interactions
- **E2E tests** for critical user flows
- **Visual regression testing** for UI consistency

### Documentation Requirements
- **JSDoc comments** for all public functions
- **README files** for complex components
- **API documentation** updates when needed
- **Changelog** for significant changes

### Git Workflow
- **Feature branches** for all development
- **Conventional commits** for clear history
- **PR reviews** before merging to main
- **Automated testing** in CI/CD pipeline

### Error Handling
- **Global error boundary** for unhandled errors
- **Toast notifications** for user feedback
- **Logging** for debugging and monitoring
- **Graceful degradation** for failed API calls

### Deployment Guidelines
- **Environment variables** for all configuration
- **Build optimization** for production
- **Health checks** for monitoring
- **Rollback strategy** for failed deployments

## Architecture Decisions

### Why Next.js 15?
- **App Router** for modern routing patterns
- **Server Components** for better performance
- **Built-in optimizations** for images, fonts, scripts
- **Edge runtime** compatibility for global deployment

### Why Shadcn/UI?
- **Customizable components** that fit our design system
- **Accessibility built-in** for compliance requirements
- **TypeScript first** for better developer experience
- **Tailwind integration** for consistent styling

### Why TanStack Query?
- **Advanced caching** with stale-while-revalidate
- **Background updates** for real-time data
- **Optimistic updates** for better UX
- **Error handling** with retry mechanisms

### Why Zustand?
- **Minimal boilerplate** compared to Redux
- **TypeScript support** out of the box
- **Devtools integration** for debugging
- **Modular store** structure

## Integration with Existing System

### API Compatibility
- **Maintain existing endpoints** - don't modify backend
- **Use existing authentication** flow and tokens
- **Follow existing data models** from DynamoDB
- **Preserve existing business logic**

### Migration Strategy
- **Gradual rollout** with feature flags
- **A/B testing** for new features
- **User feedback** collection and iteration
- **Performance monitoring** during transition

### Backward Compatibility
- **Support existing data** formats
- **Handle legacy API** responses gracefully
- **Maintain existing** user workflows
- **Preserve existing** integrations

## Quality Assurance

### Code Review Checklist
- [ ] TypeScript strict mode compliance
- [ ] Accessibility standards met
- [ ] Performance optimizations applied
- [ ] Error handling implemented
- [ ] Tests written and passing
- [ ] Documentation updated

### Performance Benchmarks
- **First Contentful Paint**: < 1.5 seconds
- **Largest Contentful Paint**: < 2.5 seconds
- **Cumulative Layout Shift**: < 0.1
- **Time to Interactive**: < 3 seconds
- **Lighthouse Score**: > 90

### Accessibility Standards
- **WCAG 2.1 AA** compliance
- **Keyboard navigation** support
- **Screen reader** compatibility
- **Color contrast** ratios met
- **Focus management** implemented

### Browser Support
- **Chrome**: Latest 2 versions
- **Firefox**: Latest 2 versions
- **Safari**: Latest 2 versions
- **Edge**: Latest 2 versions
- **Mobile browsers**: iOS Safari, Chrome Mobile

## Monitoring and Analytics

### Performance Monitoring
- **Core Web Vitals** tracking
- **Error tracking** with Sentry
- **Performance budgets** enforcement
- **Real user monitoring** implementation

### User Analytics
- **User journey** tracking
- **Feature usage** analytics
- **A/B testing** results
- **Conversion funnel** analysis

### Technical Metrics
- **API response times**
- **Error rates**
- **Bundle size** tracking
- **Cache hit rates** 