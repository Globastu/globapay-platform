#!/usr/bin/env node

/**
 * Coverage threshold checker for CI/CD pipeline
 * Validates that code coverage meets minimum thresholds for business logic
 */

import { readFileSync } from 'fs';
import { join } from 'path';

const COVERAGE_FILE = 'coverage/coverage-summary.json';
const THRESHOLDS = {
  global: {
    branches: 80,
    functions: 80,
    lines: 80,
    statements: 80,
  },
  businessLogic: {
    branches: 85,
    functions: 85,
    lines: 85,
    statements: 85,
  },
};

function checkCoverage() {
  try {
    const coverageData = JSON.parse(readFileSync(COVERAGE_FILE, 'utf8'));
    const { total } = coverageData;
    
    console.log('📊 Coverage Report Summary');
    console.log('==========================');
    
    // Global thresholds
    const globalResults = {
      branches: total.branches.pct >= THRESHOLDS.global.branches,
      functions: total.functions.pct >= THRESHOLDS.global.functions,
      lines: total.lines.pct >= THRESHOLDS.global.lines,
      statements: total.statements.pct >= THRESHOLDS.global.statements,
    };
    
    console.log('\n🌍 Global Coverage:');
    console.log(`  Branches:   ${total.branches.pct.toFixed(1)}% ${globalResults.branches ? '✅' : '❌'} (>= ${THRESHOLDS.global.branches}%)`);
    console.log(`  Functions:  ${total.functions.pct.toFixed(1)}% ${globalResults.functions ? '✅' : '❌'} (>= ${THRESHOLDS.global.functions}%)`);
    console.log(`  Lines:      ${total.lines.pct.toFixed(1)}% ${globalResults.lines ? '✅' : '❌'} (>= ${THRESHOLDS.global.lines}%)`);
    console.log(`  Statements: ${total.statements.pct.toFixed(1)}% ${globalResults.statements ? '✅' : '❌'} (>= ${THRESHOLDS.global.statements}%)`);
    
    // Check business logic modules
    const businessLogicFiles = Object.keys(coverageData)
      .filter(file => 
        file.includes('/modules/') || 
        file.includes('/services/') ||
        file.includes('src/modules/') ||
        file.includes('src/services/')
      )
      .filter(file => file !== 'total');
    
    if (businessLogicFiles.length > 0) {
      console.log('\n🏢 Business Logic Coverage:');
      
      let businessLogicPassed = true;
      
      businessLogicFiles.forEach(file => {
        const fileCoverage = coverageData[file];
        const fileResults = {
          branches: fileCoverage.branches.pct >= THRESHOLDS.businessLogic.branches,
          functions: fileCoverage.functions.pct >= THRESHOLDS.businessLogic.functions,
          lines: fileCoverage.lines.pct >= THRESHOLDS.businessLogic.lines,
          statements: fileCoverage.statements.pct >= THRESHOLDS.businessLogic.statements,
        };
        
        const allPassed = Object.values(fileResults).every(Boolean);
        if (!allPassed) businessLogicPassed = false;
        
        console.log(`\n  📁 ${file.replace(process.cwd() + '/', '')}`);
        console.log(`    Branches:   ${fileCoverage.branches.pct.toFixed(1)}% ${fileResults.branches ? '✅' : '❌'}`);
        console.log(`    Functions:  ${fileCoverage.functions.pct.toFixed(1)}% ${fileResults.functions ? '✅' : '❌'}`);
        console.log(`    Lines:      ${fileCoverage.lines.pct.toFixed(1)}% ${fileResults.lines ? '✅' : '❌'}`);
        console.log(`    Statements: ${fileCoverage.statements.pct.toFixed(1)}% ${fileResults.statements ? '✅' : '❌'}`);
      });
      
      if (!businessLogicPassed) {
        console.log('\n❌ Business logic coverage thresholds not met');
        process.exit(1);
      }
    }
    
    // Overall result
    const allGlobalPassed = Object.values(globalResults).every(Boolean);
    
    if (allGlobalPassed) {
      console.log('\n✅ All coverage thresholds met!');
      process.exit(0);
    } else {
      console.log('\n❌ Coverage thresholds not met');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Failed to read coverage report:', error.message);
    console.log('\n💡 Make sure to run tests with coverage first:');
    console.log('   pnpm test:coverage');
    process.exit(1);
  }
}

checkCoverage();