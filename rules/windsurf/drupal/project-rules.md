# Drupal Project Rules for Cursor

## Project Structure Guidelines

### Module Organization
- Keep modules focused and single-purpose
- Use descriptive module names with proper namespacing
- Organize modules in logical directory structure
- Separate custom modules from contributed modules

### Theme Organization
- Use proper theme inheritance
- Organize CSS/SCSS files logically
- Keep template files organized by content type
- Use proper theme hook implementations

### Configuration Management
- Export configuration to code
- Use configuration splits for environment differences
- Keep sensitive configuration out of version control
- Document configuration dependencies

## Development Workflow

### Git Workflow
- Use feature branches for all development
- Write descriptive commit messages
- Keep commits atomic and focused
- Use conventional commit format
- Review code before merging

### Code Review Process
- All code must be reviewed before merge
- Check for Drupal coding standards compliance
- Verify security best practices
- Ensure proper error handling
- Test functionality thoroughly

### Testing Requirements
- Write unit tests for custom modules
- Implement integration tests for complex functionality
- Test across different environments
- Verify accessibility compliance
- Performance testing for critical paths

## Security Guidelines

### Input Validation
- Always validate and sanitize user input
- Use Drupal's form validation system
- Implement proper access control
- Use prepared statements for database queries
- Follow Drupal's security best practices

### Access Control
- Implement proper user permissions
- Use Drupal's access control system
- Check permissions before displaying content
- Implement proper role-based access
- Audit access control regularly

### Data Protection
- Encrypt sensitive data
- Use secure communication protocols
- Implement proper session management
- Follow data retention policies
- Regular security audits

## Performance Guidelines

### Database Optimization
- Use proper indexing strategies
- Optimize database queries
- Implement caching where appropriate
- Monitor query performance
- Use database connection pooling

### Caching Strategy
- Implement page caching
- Use block caching appropriately
- Cache expensive operations
- Use CDN for static assets
- Monitor cache hit rates

### Asset Optimization
- Minify CSS and JavaScript
- Optimize image sizes and formats
- Use lazy loading for images
- Implement proper asset versioning
- Monitor asset delivery performance

## Accessibility Standards

### WCAG Compliance
- Meet WCAG 2.1 AA standards
- Implement proper semantic HTML
- Ensure keyboard navigation
- Provide alternative text for images
- Test with screen readers

### Form Accessibility
- Use proper form labels
- Implement error handling
- Provide clear error messages
- Ensure proper focus management
- Test with assistive technologies

### Content Accessibility
- Use proper heading hierarchy
- Provide descriptive link text
- Ensure sufficient color contrast
- Implement proper ARIA attributes
- Test with various assistive tools

## Documentation Requirements

### Code Documentation
- Document all public APIs
- Use proper PHPDoc comments
- Document complex algorithms
- Provide usage examples
- Keep documentation up to date

### Project Documentation
- Maintain README files
- Document installation procedures
- Provide configuration guides
- Document deployment processes
- Keep troubleshooting guides current

### API Documentation
- Document all custom APIs
- Provide usage examples
- Document parameter requirements
- Include error handling examples
- Maintain API versioning

## Quality Assurance

### Code Quality
- Follow Drupal coding standards
- Use static analysis tools
- Implement proper error handling
- Write self-documenting code
- Regular code quality reviews

### Testing Strategy
- Implement comprehensive testing
- Use automated testing tools
- Test across different browsers
- Verify mobile responsiveness
- Performance testing

### Monitoring
- Implement error logging
- Monitor application performance
- Track user experience metrics
- Monitor security events
- Regular health checks

## Deployment Guidelines

### Environment Management
- Use separate environments for development, staging, and production
- Implement proper environment-specific configuration
- Use deployment automation tools
- Implement rollback procedures
- Monitor deployment success

### Backup Strategy
- Regular database backups
- Version control for all code
- Configuration backup procedures
- Document recovery procedures
- Test backup restoration

### Security Deployment
- Use HTTPS in production
- Implement proper firewall rules
- Regular security updates
- Monitor for security vulnerabilities
- Implement intrusion detection

## Maintenance Procedures

### Regular Maintenance
- Update Drupal core and modules
- Review and update dependencies
- Monitor performance metrics
- Review security reports
- Update documentation

### Emergency Procedures
- Document emergency contact procedures
- Implement incident response plan
- Maintain backup procedures
- Document rollback processes
- Regular emergency drills

### Performance Monitoring
- Monitor site performance
- Track user experience metrics
- Monitor server resources
- Implement alerting systems
- Regular performance reviews
