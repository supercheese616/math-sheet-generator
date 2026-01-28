class Problem {
  final int operand1;
  final int operand2;
  final String operator;
  final int answer;
  final String? customDisplay; // 用于特殊显示，如乘法口诀 "一二得二"

  Problem(this.operand1, this.operand2, this.operator, this.answer, {this.customDisplay});

  // 标准算式显示: "3 + 5 ="
  String get equation => "$operand1 $operator $operand2 = ";
  
  // 完整算式含答案: "3 + 5 = 8"
  String get fullEquation => "$equation $answer";

  @override
  String toString() => fullEquation;
}
