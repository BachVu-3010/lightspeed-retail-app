import '../setupTest';
import isValidId from './isValidId';

describe('isValidId', () => {
  it('should return true if ID is valid, otherwise false', () => {
    isValidId('category-id').should.be.true();
    isValidId('none').should.be.false();
    isValidId('').should.be.false();
    isValidId().should.be.false();
  });
});
