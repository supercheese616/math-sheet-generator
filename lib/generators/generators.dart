import 'dart:math';
import '../models/problem.dart';
import 'base_generator.dart';

final _random = Random();

class AdditionUnder20Generator extends MathGenerator {
  @override
  String get name => "20以内加法";

  @override
  Problem generate() {
    // 和 <= 20
    int a = _random.nextInt(21); // 0-20
    int b = _random.nextInt(21 - a); 
    return Problem(a, b, "+", a + b);
  }
}

class MixedUnder20Generator extends MathGenerator {
  @override
  String get name => "20以内加减混合";

  @override
  Problem generate() {
    bool isAdd = _random.nextBool();
    if (isAdd) {
      int a = _random.nextInt(21);
      int b = _random.nextInt(21 - a);
      return Problem(a, b, "+", a + b);
    } else {
      int a = _random.nextInt(21);
      int b = _random.nextInt(a + 1); // b <= a
      return Problem(a, b, "-", a - b);
    }
  }
}

class NoBorrowSubtractionUnder100Generator extends MathGenerator {
  @override
  String get name => "100以内不退位减法";

  @override
  Problem generate() {
    // 个位减个位 >= 0
    int aTens = _random.nextInt(10); // 0-9
    int aOnes = _random.nextInt(10); // 0-9
    int a = aTens * 10 + aOnes;
    
    // b 的个位必须 <= a 的个位
    int bTens = _random.nextInt(aTens + 1);
    int bOnes = _random.nextInt(aOnes + 1);
    int b = bTens * 10 + bOnes;

    return Problem(a, b, "-", a - b);
  }
}

class MixedUnder100Generator extends MathGenerator {
  @override
  String get name => "100以内加减混合";

  @override
  Problem generate() {
    bool isAdd = _random.nextBool();
    if (isAdd) {
      int a = _random.nextInt(100);
      int b = _random.nextInt(100 - a);
      return Problem(a, b, "+", a + b);
    } else {
      int a = _random.nextInt(100);
      int b = _random.nextInt(a + 1);
      return Problem(a, b, "-", a - b);
    }
  }
}

class MultiplicationGenerator extends MathGenerator {
  @override
  String get name => "乘法练习 (9x9)";

  @override
  Problem generate() {
    int a = _random.nextInt(9) + 1; // 1-9
    int b = _random.nextInt(9) + 1;
    return Problem(a, b, "×", a * b);
  }
}

class DivisionGenerator extends MathGenerator {
  @override
  String get name => "表内除法 (整除)";

  @override
  Problem generate() {
    int b = _random.nextInt(9) + 1; // 除数 1-9
    int answer = _random.nextInt(9) + 1; // 商 1-9
    int a = b * answer;
    return Problem(a, b, "÷", answer);
  }
}

// 注册所有生成器
final List<MathGenerator> allGenerators = [
  AdditionUnder20Generator(),
  MixedUnder20Generator(),
  NoBorrowSubtractionUnder100Generator(),
  MixedUnder100Generator(),
  MultiplicationGenerator(),
  DivisionGenerator(),
];
